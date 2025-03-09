import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import { parsePDF } from './pdfHelper.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import resume parsing utilities
const resumeParser = await import('./resumeParser.js');
const { processBulletPointResponse, RESUME_SYSTEM_PROMPT } = resumeParser;

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

// Setup middleware
app.use(cors());
app.use(express.json());

// Claude API configuration
const CLAUDE_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseUrl: 'https://api.anthropic.com',
  apiVersion: '2023-06-01',
  model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
  maxTokens: 1000,
  temperature: 0.7,
};

/**
 * Makes a request to Claude API
 */
async function callClaudeAPI(options) {
  const { 
    prompt, 
    systemPrompt,
    maxTokens = CLAUDE_CONFIG.maxTokens,
    temperature = CLAUDE_CONFIG.temperature 
  } = options;

  if (!CLAUDE_CONFIG.apiKey) {
    console.error('Claude API key is not set. Please add ANTHROPIC_API_KEY to your environment variables.');
    throw new Error('Claude API key is not configured.');
  }

  try {
    const response = await fetch(`${CLAUDE_CONFIG.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_CONFIG.apiKey,
        'anthropic-version': CLAUDE_CONFIG.apiVersion,
      },
      body: JSON.stringify({
        model: CLAUDE_CONFIG.model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API returned error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error('Failed to get response from Claude. Please try again later.');
  }
};

/**
 * Improves a resume bullet point using Claude AI
 */
async function improveBulletPoint(bulletPoint, additionalContext = '') {
  const systemPrompt = `
    You are an expert resume writer who helps professionals improve their resume bullet points.
    Your task is to enhance the given bullet point by:
    1. Using stronger action verbs
    2. Highlighting quantifiable achievements
    3. Focusing on impact and results
    4. Making technical skills and technologies stand out
    5. Ensuring conciseness (ideally under 2 lines)
    
    Respond with ONLY a JSON object containing the following fields:
    - improvedBulletPoint: The enhanced version of the bullet point
    - reasoning: Brief explanation of the improvements you made
    - followUpQuestions: An array of 3 questions to elicit more information that could further improve the bullet point
  `;

  const prompt = `
    Original Bullet Point: "${bulletPoint}"
    
    ${additionalContext ? `Additional Context: ${additionalContext}` : ''}
    
    Please improve this resume bullet point to make it more impactful and professional.
  `;

  try {
    const response = await callClaudeAPI({
      prompt,
      systemPrompt,
      temperature: 0.6,
    });

    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Claude');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      improvedBulletPoint: parsedResponse.improvedBulletPoint,
      reasoning: parsedResponse.reasoning,
      followUpQuestions: parsedResponse.followUpQuestions
    };
  } catch (error) {
    console.error('Error improving bullet point:', error);
    throw new Error('Failed to improve the bullet point. Please try again.');
  }
}

// Resume parsing utilities moved to resumeParser.js

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Simple test endpoint that doesn't require file upload
app.get('/api/v1/resume/parse/simple', async (req, res) => {
  try {
    console.log('Simple test endpoint called');
    
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
    
    console.log('Using sample resume text, length:', resumeText.length);
    
    // Get response from Claude API with simplified parsing
    const response = await callClaudeAPI({
      prompt: resumeText,
      systemPrompt: RESUME_SYSTEM_PROMPT,
      temperature: 0.2,
    });
    
    // Log a snippet of the response for debugging
    console.log('Claude response (first 200 chars):', response.substring(0, 200));
    
    try {
      // Process the response to extract bullet points
      const result = processBulletPointResponse(response);
      res.json(result);
    } catch (error) {
      console.error('Error processing bullet points:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process bullet points'
      });
    }
  } catch (error) {
    console.error('Error in simple test endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process test resume'
    });
  }
});

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
    const { bulletPoint, additionalContext = '' } = req.body;
    
    if (!bulletPoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bullet point is required' 
      });
    }
    
    const result = await improveBulletPoint(bulletPoint, additionalContext);
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
      prompt: resumeText,
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
          const chunkPrompt = `PARTIAL RESUME (SECTION ${i+1} OF ${chunks.length}):\n\n${chunks[i]}`;
          
          // If this isn't the first chunk, add a small delay to avoid rate limits
          if (i > 0) {
            console.log('Adding delay between API calls to avoid rate limits');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const chunkResponse = await callClaudeAPI({
            prompt: chunkPrompt,
            systemPrompt: RESUME_SYSTEM_PROMPT,
            temperature: 0.2,
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
        prompt: resumeText,
        systemPrompt: RESUME_SYSTEM_PROMPT,
        temperature: 0.2,
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
});