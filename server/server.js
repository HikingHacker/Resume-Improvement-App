const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { parsePDF } = require('./pdfHelper');

// Import resume parsing utilities
const resumeParser = require('./resumeParser');
const {
  processBulletPointResponse,
  parseJsonFromModelResponse,
  RESUME_SYSTEM_PROMPT
} = resumeParser;
const prompts = require('./prompts');
const {
  modelOmitsSamplingParams,
  extractClaudeText,
  summarizeClaudeError,
  buildClaudeMessagesBody,
  formatBulletImprovement,
  formatBulletDetails,
} = require('./claudeUtils');

// Initialize environment variables
dotenv.config();

// Setup Express
const app = express();
const port = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({ 
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Setup middleware with CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://hikinghacker.github.io',
    'https://HikingHacker.github.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Add global middleware to ensure CORS headers on all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Check if the origin is in our allowed list
  if (corsOptions.origin.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Allow localhost during development
    if (origin && origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', 'https://hikinghacker.github.io');
    }
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Add a specific OPTIONS handler for CORS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://hikinghacker.github.io');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

// Claude API configuration
const CLAUDE_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseUrl: 'https://api.anthropic.com',
  apiVersion: '2023-06-01',
  model: process.env.CLAUDE_MODEL || 'claude-sonnet-5',
  maxTokens: 8192,
  temperature: 0.7,
};

let omitSamplingParams = modelOmitsSamplingParams(CLAUDE_CONFIG.model);

/**
 * Makes a request to Claude API with proper error handling, backoff, and status tracking
 */
async function callClaudeAPI(options) {
  const { 
    prompt, 
    systemPrompt,
    maxTokens = CLAUDE_CONFIG.maxTokens,
    temperature = CLAUDE_CONFIG.temperature,
    requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  } = options;

  if (!CLAUDE_CONFIG.apiKey) {
    console.error('Claude API key is not set. Please add ANTHROPIC_API_KEY to your environment variables.');
    throw new Error('Claude API key is not configured.');
  }

  // Create a record for this request in our tracking system
  let requestStatus = {
    id: requestId,
    status: 'pending',
    progress: 0,
    startTime: Date.now(),
    lastUpdated: Date.now(),
    retryCount: 0,
    error: null
  };
  
  // Store the request status (in-memory for simple implementation)
  requestStatusMap.set(requestId, requestStatus);

  // Retry configuration
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  const MAX_DELAY = 15000; // 15 seconds

  try {
    let attempt = 0;
    
    while (attempt <= MAX_RETRIES) {
      try {
        // Update request status
        updateRequestStatus(requestId, {
          status: attempt > 0 ? 'retrying' : 'in_progress',
          progress: 25,
          retryCount: attempt,
          lastUpdated: Date.now()
        });
        
        // Log the attempt
        if (attempt > 0) {
          console.log(`[${requestId}] Retry attempt ${attempt}/${MAX_RETRIES}`);
        }
        
        // Make the API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        const response = await fetch(`${CLAUDE_CONFIG.baseUrl}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_CONFIG.apiKey,
            'anthropic-version': CLAUDE_CONFIG.apiVersion,
          },
          body: JSON.stringify(buildClaudeMessagesBody({
            model: CLAUDE_CONFIG.model,
            maxTokens,
            system: systemPrompt,
            prompt,
            temperature,
            omitSamplingParams,
          })),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Update request status
        updateRequestStatus(requestId, {
          progress: 50,
          lastUpdated: Date.now()
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] Claude API error:`, errorText);
          
          // Handle different error types with specific retry logic
          const status = response.status;
          const claudeMessage = summarizeClaudeError(errorText);

          if (status === 400 && /temperature|top_p|top_k/i.test(errorText) && !omitSamplingParams) {
            console.warn(`[${requestId}] Model rejected sampling params; retrying without temperature`);
            omitSamplingParams = true;
            continue;
          }
          
          // Don't retry certain errors
          if (status === 400 || status === 401 || status === 403) {
            throw new Error(`Claude API returned error: ${status} ${claudeMessage || response.statusText}`);
          }
          
          // For server errors and rate limits, retry with backoff
          if (status >= 500 || status === 429) {
            // Get retry delay from headers if available, or use exponential backoff
            let retryAfter = response.headers.get('retry-after');
            let delay;
            
            if (retryAfter) {
              delay = parseInt(retryAfter, 10) * 1000; // Convert to ms
            } else {
              // Exponential backoff with jitter
              const jitter = Math.random() * 300;
              delay = Math.min(BASE_DELAY * Math.pow(2, attempt) + jitter, MAX_DELAY);
            }
            
            console.log(`[${requestId}] Retrying after ${delay}ms...`);
            
            updateRequestStatus(requestId, {
              status: 'waiting_to_retry',
              error: `${status} ${response.statusText}`,
              lastUpdated: Date.now()
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          
          throw new Error(`Claude API returned error: ${status} ${claudeMessage || response.statusText}`);
        }

        // Update request status
        updateRequestStatus(requestId, {
          progress: 75,
          lastUpdated: Date.now()
        });

        const data = await response.json();

        if (data.stop_reason === 'max_tokens') {
          console.warn(`[${requestId}] Claude response truncated (stop_reason=max_tokens)`);
        }
        
        const text = extractClaudeText(data);
        if (!text) {
          console.error(`[${requestId}] Empty Claude content.`, {
            stop_reason: data?.stop_reason,
            keys: Object.keys(data || {}),
            contentPreview: JSON.stringify(data?.content)?.slice(0, 500),
          });
          throw new Error('Claude returned an empty response');
        }

        // Request succeeded
        updateRequestStatus(requestId, {
          status: 'completed',
          progress: 100,
          lastUpdated: Date.now()
        });
        
        return text;
      } catch (error) {
        // If this is an abort error, it's a timeout
        if (error.name === 'AbortError') {
          console.error(`[${requestId}] Request timed out`);
          updateRequestStatus(requestId, {
            status: 'timeout',
            error: 'Request timed out',
            lastUpdated: Date.now()
          });
        }
        
        // If we've used all retries, or if it's not a retryable error, throw
        if (attempt >= MAX_RETRIES || !isRetryableError(error)) {
          updateRequestStatus(requestId, {
            status: 'failed',
            error: error.message,
            lastUpdated: Date.now()
          });
          throw error;
        }
        
        // Calculate backoff time with jitter
        const jitter = Math.random() * 300;
        const delay = Math.min(BASE_DELAY * Math.pow(2, attempt) + jitter, MAX_DELAY);
        
        console.log(`[${requestId}] Request failed, retrying after ${delay}ms...`);
        console.error(`[${requestId}] Error:`, error);
        
        updateRequestStatus(requestId, {
          status: 'waiting_to_retry',
          error: error.message,
          lastUpdated: Date.now()
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    
    // If we get here, we've exceeded max retries
    throw new Error(`Failed after ${MAX_RETRIES} retry attempts`);
  } catch (error) {
    console.error(`[${requestId}] Final error calling Claude API:`, error);
    
    // Update the request status one final time
    updateRequestStatus(requestId, {
      status: 'failed',
      error: error.message,
      lastUpdated: Date.now()
    });
    
    throw error;
  }
};

// Request status tracking
const requestStatusMap = new Map();

/**
 * Helper to update request status
 */
function updateRequestStatus(requestId, updates) {
  const status = requestStatusMap.get(requestId);
  if (status) {
    requestStatusMap.set(requestId, { ...status, ...updates });
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  // Network errors, timeouts, and 5xx errors are retryable
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }

  const message = error.message || '';
  if (message.includes('500') || message.includes('429')) {
    return true;
  }
  if (message.includes('empty response')) {
    return true;
  }
  
  return false;
}

function isJsonRetryableError(error) {
  const message = error.message || '';
  return /parse json/i.test(message) || /empty response/i.test(message);
}

async function requestBulletRewrite({ prompt, systemPrompt, temperature, failureMessage, attempts = 2 }) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await callClaudeAPI({ prompt, systemPrompt, temperature });
      const parsedResponse = parseJsonFromModelResponse(response);
      if (!parsedResponse) {
        throw new Error('Failed to parse JSON response from Claude');
      }

      const result = formatBulletImprovement(parsedResponse);
      if (!result.improvedBulletPoint) {
        throw new Error('Failed to parse JSON response from Claude');
      }
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Error rewriting bullet (attempt ${attempt}/${attempts}):`, error);
      if (attempt === attempts || !isJsonRetryableError(error)) {
        throw new Error(error.message || failureMessage);
      }
    }
  }
  throw new Error(lastError?.message || failureMessage);
}

/**
 * Improves a resume bullet point using Claude AI
 */
async function improveBulletPoint(bulletPoint, additionalContext = '') {
  return requestBulletRewrite({
    prompt: prompts.getBulletImprovementPrompt(bulletPoint, additionalContext),
    systemPrompt: prompts.BULLET_IMPROVEMENT_SYSTEM_PROMPT,
    temperature: 0.7,
    failureMessage: 'Failed to improve the bullet point. Please try again.',
  });
}

/**
 * Asks follow-up questions so the candidate can add facts before a rewrite.
 */
async function gatherBulletDetails(bulletPoint, additionalContext = '') {
  let lastError;
  const attempts = 2;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await callClaudeAPI({
        prompt: prompts.getBulletDetailsPrompt(bulletPoint, additionalContext),
        systemPrompt: prompts.BULLET_DETAILS_SYSTEM_PROMPT,
        temperature: 0.4,
      });
      const parsedResponse = parseJsonFromModelResponse(response);
      if (!parsedResponse) {
        throw new Error('Failed to parse JSON response from Claude');
      }
      const result = formatBulletDetails(parsedResponse);
      if (!result.followUpQuestions.length) {
        throw new Error('Failed to parse JSON response from Claude');
      }
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Error gathering bullet details (attempt ${attempt}/${attempts}):`, error);
      if (attempt === attempts || !isJsonRetryableError(error)) {
        throw new Error(error.message || 'Failed to generate follow-up questions. Please try again.');
      }
    }
  }
  throw new Error(lastError?.message || 'Failed to generate follow-up questions. Please try again.');
}

/**
 * Drafts new skill bullets with placeholders for the user to fill in.
 */
async function generateSkillBullet({ skillName, skillRecommendation, jobDetails, selectedKeywords, additionalContext = '' } = {}) {
  const extra = additionalContext ? `\n\nUser notes:\n${additionalContext}` : '';
  return requestBulletRewrite({
    prompt: `${prompts.getSkillBulletPrompt(skillName, skillRecommendation, jobDetails, selectedKeywords)}${extra}`,
    systemPrompt: prompts.SKILL_BULLET_SYSTEM_PROMPT,
    temperature: 0.7,
    failureMessage: 'Failed to generate the skill bullet. Please try again.',
  });
}

// Resume parsing utilities moved to resumeParser.js

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    corsEnabled: true,
    allowedOrigins: corsOptions.origin 
  });
});

// Status check endpoint for long-running processes
app.get('/api/request-status/:requestId', (req, res) => {
  const { requestId } = req.params;
  
  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: 'Request ID is required'
    });
  }
  
  const status = requestStatusMap.get(requestId);
  
  if (!status) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }
  
  // Clean up completed requests that are more than 15 minutes old
  const now = Date.now();
  if ((status.status === 'completed' || status.status === 'failed') && 
      now - status.lastUpdated > 15 * 60 * 1000) {
    requestStatusMap.delete(requestId);
  }
  
  // Calculate elapsed time
  const elapsedTime = now - status.startTime;
  
  // For completed requests with results, return the results
  if (status.status === 'completed' && status.result) {
    return res.json({
      success: true,
      requestId,
      status: status.status,
      progress: status.progress,
      elapsedTimeMs: elapsedTime,
      retryCount: status.retryCount,
      result: status.result
    });
  }
  
  // For requests still in progress or failed
  res.json({
    success: true,
    requestId,
    status: status.status,
    progress: status.progress,
    elapsedTimeMs: elapsedTime,
    retryCount: status.retryCount,
    error: status.error
  });
});

// Result retrieval endpoint for completed requests
app.get('/api/request-result/:requestId', (req, res) => {
  const { requestId } = req.params;
  
  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: 'Request ID is required'
    });
  }
  
  const status = requestStatusMap.get(requestId);
  
  if (!status) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }
  
  if (status.status !== 'completed' || !status.result) {
    return res.status(400).json({
      success: false,
      message: `Request is not complete or has no results. Current status: ${status.status}`,
      status: status.status,
      progress: status.progress
    });
  }
  
  // Return just the results
  res.json(status.result);
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is properly configured',
    receivedOrigin: req.headers.origin || 'No origin header received',
    corsEnabled: true
  });
});

// Simple test endpoint that doesn't require file upload
app.get('/api/v1/resume/parse/simple', async (req, res) => {
  try {
    console.log('Simple test endpoint called');
    
    // Create a unique request ID for tracking
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    console.log(`[${requestId}] Starting simple resume parse request`);
    
    // Use a fixed sample resume text
    const resumeText = `
John Doe
Software Engineer
john.doe@example.com | (123) 456-7890

EXPERIENCE
Senior Software Engineer | ABC Tech | 2020-Present
• Developed and maintained web applications using React and Node.js
• Increased website performance by 40% through optimization techniques
• Collaborated with cross-functional teams to deliver projects on time

Software Engineer | XYZ Solutions | 2017-2020
• Built RESTful APIs using Express.js and MongoDB
• Refactored legacy codebase, reducing technical debt by 30%

EDUCATION
Master of Science in Computer Science | University of Technology | 2017

SKILLS
JavaScript, React, Node.js, Express, MongoDB, AWS, Docker
`;
    
    console.log(`[${requestId}] Using sample resume text, length:`, resumeText.length);
    
    // For long-running tasks, immediately return a 202 Accepted response with the request ID
    res.status(202).json({
      success: true,
      message: 'Processing started, check status endpoint for updates',
      requestId: requestId,
      statusEndpoint: `/api/request-status/${requestId}`
    });
    
    // Then continue processing asynchronously
    processParseSampleRequest(requestId, resumeText).catch(error => {
      console.error(`[${requestId}] Unhandled error in async processing:`, error);
    });
  } catch (error) {
    console.error('Error starting simple test endpoint processing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process test resume'
    });
  }
});

/**
 * Process the resume parse request asynchronously
 */
async function processParseSampleRequest(requestId, resumeText) {
  try {
    // Get response from Claude API with simplified parsing
    const response = await callClaudeAPI({
      prompt: prompts.getResumeParserPrompt(resumeText),
      systemPrompt: RESUME_SYSTEM_PROMPT,
      temperature: 0.2,
      requestId // Pass the request ID for tracking
    });
    
    console.log(`[${requestId}] Claude response received, length:`, response.length);
    console.log(`[${requestId}] First 200 chars:`, response.substring(0, 200));
    
    try {
      // Process the response to extract bullet points
      const result = processBulletPointResponse(response);
      
      // Store the result with the request for later retrieval
      updateRequestStatus(requestId, {
        status: 'completed',
        progress: 100,
        result: result,
        lastUpdated: Date.now()
      });
      
      console.log(`[${requestId}] Processing completed successfully`);
    } catch (error) {
      console.error(`[${requestId}] Error processing bullet points:`, error);
      updateRequestStatus(requestId, {
        status: 'failed',
        progress: 75,
        error: error.message || 'Failed to process bullet points',
        lastUpdated: Date.now()
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Error in async processing:`, error);
    updateRequestStatus(requestId, {
      status: 'failed',
      progress: 50,
      error: error.message || 'Failed to process test resume',
      lastUpdated: Date.now()
    });
  }
}

// Debug endpoint - echo request data
app.post('/api/debug', (req, res) => {
  console.log('Debug - Headers:', req.headers);
  console.log('Debug - Body:', req.body);
  res.json({ 
    success: true, 
    message: 'Debug info logged to server console',
    received: {
      headers: req.headers,
      body: req.body
    }
  });
});

// Endpoint to improve a bullet point
app.post('/api/v1/resume/improve', async (req, res) => {
  try {
    const { bulletPoint, additionalContext = '', task, skillName, skillRecommendation, jobDetails, selectedKeywords } = req.body;
    
    if (task === 'skill' && !skillName) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    if (task !== 'skill' && !bulletPoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bullet point is required' 
      });
    }
    
    const result = task === 'skill'
      ? await generateSkillBullet({
          skillName,
          skillRecommendation,
          jobDetails,
          selectedKeywords,
          additionalContext,
        })
      : task === 'details'
        ? await gatherBulletDetails(bulletPoint, additionalContext)
        : await improveBulletPoint(bulletPoint, additionalContext);
    res.json(result);
  } catch (error) {
    console.error('Error in improve endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to improve the bullet point' 
    });
  }
});

// Test endpoint for resume parsing
app.get('/api/v1/resume/parse/test', async (req, res) => {
  try {
    console.log('Test parse endpoint called');
    // Read the test resume file
    const testResumePath = path.join(__dirname, 'testResume.txt');
    console.log('Test resume path:', testResumePath);
    const resumeText = fs.readFileSync(testResumePath, 'utf8');
    
    console.log('Sending test resume to Claude API with explicit prompt');
    
    // Get response from Claude API
    const response = await callClaudeAPI({
      prompt: prompts.getResumeParserPrompt(resumeText),
      systemPrompt: RESUME_SYSTEM_PROMPT,
      temperature: 0.2,
    });
    
    // Log a snippet of the response for debugging
    console.log('Claude response (first 200 chars):', response.substring(0, 200));
    console.log('Response length:', response.length);
    
    try {
      // Process the response to extract bullet points
      const result = processBulletPointResponse(response);
      res.json(result);
    } catch (error) {
      console.error('Error processing bullet points:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process the bullet points'
      });
    }
  } catch (error) {
    console.error('Error in test parse endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to parse the test resume' 
    });
  }
});

// Endpoint to parse a resume
app.post('/api/v1/resume/parse', upload.single('resume'), async (req, res) => {
  try {
    console.log('Resume parse endpoint called');
    console.log('Request file:', req.file);
    console.log('Request body keys:', Object.keys(req.body));
    
    let resumeText;
    
    if (req.file) {
      console.log('Processing uploaded file:', req.file.path);
      try {
        // The file path is already absolute when using multer
        const filePath = req.file.path;
        console.log('Full file path:', filePath);
        console.log('File type:', req.file.mimetype);
        console.log('File size:', req.file.size, 'bytes');
        
        // Process file based on its type
        console.log('Processing file based on mimetype:', req.file.mimetype);
        
        // Handle PDF files with our custom parser
        if (req.file.mimetype === 'application/pdf') {
          console.log('PDF file detected, using custom PDF parser');
          try {
            const dataBuffer = fs.readFileSync(filePath);
            console.log('PDF file read into buffer, size:', dataBuffer.length);
            
            // Use our custom PDF parser to avoid the test file issue
            const pdfData = await parsePDF(dataBuffer);
            
            resumeText = pdfData.text;
            console.log('PDF parsing successful');
            console.log('PDF text length:', resumeText.length);
            console.log('First 200 chars of PDF:', resumeText.substring(0, 200));
          } catch (pdfError) {
            console.error('Error parsing PDF:', pdfError);
            throw new Error(`Failed to parse PDF file: ${pdfError.message}`);
          }
        } 
        // Handle text files and other formats
        else {
          console.log('Attempting to read file as text...');
          try {
            resumeText = fs.readFileSync(filePath, 'utf8');
            console.log('File read successful');
            
            // Check if the text is valid and not binary garbage
            const isBinaryGarbage = /^\u0000/.test(resumeText) || 
                                   !resumeText.trim() || 
                                   /[\uFFFD]/.test(resumeText.substring(0, 100));
            
            if (isBinaryGarbage) {
              console.log('WARNING: File appears to be binary or contains invalid UTF-8 characters');
              throw new Error('Unable to read file as text. Please upload a text or PDF file.');
            } else {
              console.log('First 200 chars:', resumeText.substring(0, 200));
            }
          } catch (readErr) {
            console.error('Error in fs.readFileSync:', readErr);
            throw readErr;
          }
        }
        
        console.log('File content length:', resumeText.length);
        
        // Clean up the uploaded file after reading
        fs.unlinkSync(filePath);
      } catch (readError) {
        console.error('Error reading file:', readError);
        return res.status(500).json({ 
          success: false, 
          message: `Error reading uploaded file: ${readError.message}` 
        });
      }
    } else if (req.body.resumeText) {
      console.log('Using text from request body');
      resumeText = req.body.resumeText;
      console.log('Resume text length:', resumeText.length);
    } else {
      console.log('No resume content found in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No resume file or text provided' 
      });
    }
    
    // Check if the text is too large for a single API call (to avoid rate limits)
    const MAX_TOKENS_PER_CALL = 30000; // Conservative limit to avoid rate limit errors
    console.log('Resume text length:', resumeText.length, 'characters');
    
    let response;
    
    // If the text is very large, we need to chunk it
    if (resumeText.length > MAX_TOKENS_PER_CALL) {
      console.log('Resume text is large, processing in chunks to avoid rate limits');
      
      // Simplified chunking approach - split by paragraphs
      const paragraphs = resumeText.split(/\n\s*\n/);
      const chunks = [];
      let currentChunk = '';
      
      for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length < MAX_TOKENS_PER_CALL) {
          currentChunk += paragraph + '\n\n';
        } else {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
          }
          currentChunk = paragraph + '\n\n';
        }
      }
      
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      
      console.log(`Split resume into ${chunks.length} chunks for processing`);
      
      // Process each chunk with a delay to avoid rate limits
      const chunkResponses = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i+1} of ${chunks.length}, size: ${chunks[i].length} chars`);
        
        try {
          // Add context to let Claude know this is a partial resume
          const chunkPrompt = prompts.getResumeParserPrompt(chunks[i], {
            chunkIndex: i,
            chunkCount: chunks.length,
          });
          
          // If this isn't the first chunk, add a small delay to avoid rate limits
          if (i > 0) {
            console.log('Adding delay between API calls to avoid rate limits');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const chunkResponse = await callClaudeAPI({
            prompt: chunkPrompt,
            systemPrompt: RESUME_SYSTEM_PROMPT,
            temperature: 0.2,
            maxTokens: 8192,
          });
          
          chunkResponses.push(chunkResponse);
        } catch (error) {
          console.error(`Error processing chunk ${i+1}:`, error);
          // Continue with other chunks even if one fails
        }
      }
      
      // Combine the responses
      response = chunkResponses.join('\n\n');
    } else {
      // For smaller resumes, process normally
      console.log('Resume size is manageable, processing in one API call');
      response = await callClaudeAPI({
        prompt: prompts.getResumeParserPrompt(resumeText),
        systemPrompt: RESUME_SYSTEM_PROMPT,
        temperature: 0.2,
        maxTokens: 8192,
      });
    }
    
    // Log a snippet of the response for debugging
    console.log('Claude response (first 200 chars):', response.substring(0, 200));
    console.log('Response length:', response.length);
    
    try {
      // Process the response to extract bullet points
      const result = processBulletPointResponse(response);
      res.json(result);
    } catch (error) {
      console.error('Error processing bullet points:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process the bullet points'
      });
    }
  } catch (error) {
    console.error('Error in parse endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to parse the resume' 
    });
  }
});

// Endpoint to perform comprehensive resume analysis with Claude AI
app.post('/api/v1/resume/analyze', async (req, res) => {
  try {
    const { resumeData, targetRole = '', jobDescriptions = [] } = req.body;
    
    if (!resumeData || !resumeData.bullet_points || !Array.isArray(resumeData.bullet_points)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid resume data with bullet points is required' 
      });
    }
    
    // Create a unique request ID for tracking
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    console.log(`[${requestId}] Resume analysis endpoint called`);
    console.log(`[${requestId}] Resume data contains`, resumeData.bullet_points.length, 'job positions');
    
    // For long-running tasks, immediately return a 202 Accepted response with the request ID
    res.status(202).json({
      success: true,
      message: 'Analysis started, check status endpoint for updates',
      requestId: requestId,
      statusEndpoint: `/api/request-status/${requestId}`
    });
    
    // Process the request asynchronously
    processResumeAnalysis(requestId, resumeData, { targetRole, jobDescriptions }).catch(error => {
      console.error(`[${requestId}] Unhandled error in async analysis:`, error);
    });
  } catch (error) {
    console.error('Error starting resume analysis:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to start resume analysis' 
    });
  }
});

/**
 * Process resume analysis asynchronously
 */
async function processResumeAnalysis(requestId, resumeData, { targetRole = '', jobDescriptions = [] } = {}) {
  try {
    // Create initial status
    const requestStatus = {
      id: requestId,
      status: 'preparing',
      progress: 10,
      startTime: Date.now(),
      lastUpdated: Date.now(),
      error: null
    };
    
    // Store the request status
    requestStatusMap.set(requestId, requestStatus);
    
    console.log(`[${requestId}] Formatted resume for analysis`);
    updateRequestStatus(requestId, { status: 'formatted', progress: 20 });
    
    // Update status before calling Claude API
    updateRequestStatus(requestId, { status: 'analyzing', progress: 30 });
    console.log(`[${requestId}] Calling Claude API for resume analysis...`);
    
    // Call Claude API with request ID for tracking
    const response = await callClaudeAPI({
      prompt: prompts.getResumeAnalysisPrompt(resumeData, { targetRole, jobDescriptions }),
      systemPrompt: prompts.RESUME_ANALYSIS_SYSTEM_PROMPT,
      temperature: 0.5,
      maxTokens: 8192,
      requestId // Pass the request ID for tracking
    });
    
    if (!response) {
      throw new Error('Claude returned an empty analysis response');
    }

    // Update status after receiving Claude's response
    console.log(`[${requestId}] Claude response received, length:`, response.length);
    updateRequestStatus(requestId, { status: 'processing', progress: 70 });
    
    // Parse the JSON response
    try {
      const analysisResult = parseJsonFromModelResponse(response);
      if (!analysisResult) {
        throw new Error('Failed to parse JSON response from Claude');
      }
      console.log(`[${requestId}] Successfully parsed JSON response`);
      
      // Add success flag to the response
      analysisResult.success = true;
      
      // Store the result with the request for later retrieval
      updateRequestStatus(requestId, {
        status: 'completed',
        progress: 100,
        result: analysisResult,
        lastUpdated: Date.now()
      });
      
      console.log(`[${requestId}] Analysis completed successfully`);
    } catch (jsonError) {
      console.error(`[${requestId}] Error parsing JSON response:`, jsonError);
      console.error(`[${requestId}] Raw response:`, response);
      updateRequestStatus(requestId, {
        status: 'failed',
        progress: 80,
        error: 'Failed to parse the analysis result: ' + jsonError.message,
        lastUpdated: Date.now()
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Error in resume analysis:`, error);
    updateRequestStatus(requestId, {
      status: 'failed',
      error: error.message || 'Failed to analyze the resume',
      lastUpdated: Date.now()
    });
  }
}

// Endpoint to get AI-powered improvement recommendations
app.post('/api/v1/resume/improvement-analytics', async (req, res) => {
  try {
    const { resumeData, improvements, savedBullets, targetRole = '', jobDescriptions = [] } = req.body;
    
    if (!resumeData || !resumeData.bullet_points || !Array.isArray(resumeData.bullet_points)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid resume data with bullet points is required' 
      });
    }
    
    console.log('Resume improvement analytics endpoint called');
    console.log('Resume data contains', resumeData.bullet_points.length, 'job positions');
    console.log('Improvements object contains', Object.keys(improvements || {}).length, 'improved bullets');
    console.log('SavedBullets object contains', Object.keys(savedBullets || {}).length, 'saved bullets');
    
    // Call Claude API
    console.log('Calling Claude API for resume improvement analytics...');
    const response = await callClaudeAPI({
      prompt: prompts.getImprovementAnalyticsPrompt(resumeData, improvements, savedBullets, {
        targetRole,
        jobDescriptions,
      }),
      systemPrompt: prompts.ANALYTICS_SYSTEM_PROMPT,
      temperature: 0.5,
      maxTokens: 8192,
    });

    if (!response) {
      throw new Error('Claude returned an empty analytics response');
    }
    
    console.log('Claude response received (first 200 chars):', String(response).substring(0, 200));
    
    // Parse the JSON response
    try {
      const analyticsResult = parseJsonFromModelResponse(response);
      if (!analyticsResult) {
        throw new Error('Failed to parse JSON response from Claude');
      }
      console.log('Successfully parsed JSON response');
      
      // Add success flag to the response
      analyticsResult.success = true;
      
      // Return the analysis
      res.json(analyticsResult);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Raw response:', response);
      res.status(500).json({
        success: false,
        message: 'Failed to parse the improvement analytics result',
        error: jsonError.message
      });
    }
  } catch (error) {
    console.error('Error in resume improvement analytics endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to analyze the resume improvements' 
    });
  }
});

// Endpoint to export resume (mock implementation)
app.post('/api/v1/resume/export', (req, res) => {
  const { bulletPoints, format = 'pdf', template = 'modern' } = req.body;
  
  if (!bulletPoints || !Array.isArray(bulletPoints)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Bullet points array is required' 
    });
  }
  
  // In a real implementation, this would generate a document
  // For now, we'll just return a mock response
  res.json({
    success: true,
    downloadUrl: 'mock-resume-download-url.pdf',
    exportedBulletPoints: bulletPoints
  });
});

// API key check
if (!CLAUDE_CONFIG.apiKey) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  Warning: ANTHROPIC_API_KEY is not set in the .env file!');
  console.log('The server will not be able to communicate with the Claude API.');
  console.log('Please set the ANTHROPIC_API_KEY in the .env file.');
}

// The uploads directory is already created above

// Start the server
app.listen(port, () => {
  console.log(`\x1b[32m%s\x1b[0m`, `✓ Server listening on port ${port}`);
  console.log(`API Base URL: http://localhost:${port}`);
  console.log(`Health Check: http://localhost:${port}/api/health`);
  console.log(`Test Resume Parsing (file): http://localhost:${port}/api/v1/resume/parse/test`);
  console.log(`Simple Test (no file upload): http://localhost:${port}/api/v1/resume/parse/simple`);
  console.log(`Resume Analysis: http://localhost:${port}/api/v1/resume/analyze`);
});