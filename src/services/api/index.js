/**
 * API Service Client
 * 
 * This module provides a structured API client for interacting with resume
 * processing and AI improvement services.
 * 
 * Supports:
 * - Mock data (offline development)
 * - Claude AI integration (via Anthropic API)
 * - Custom backend API endpoints
 */

import claudeAPI from './claude';
import prompts from './prompts';

// Configuration values - would come from environment variables in production
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  rateLimitRequests: 10,
  rateLimitPeriod: 60000, // 1 minute,
  useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true' // Default to real API
};

// Log the configuration mode during startup
console.log(`API Configuration: ${API_CONFIG.useMockData ? 'MOCK MODE' : 'REAL API MODE'}`);
console.log(`API Base URL: ${API_CONFIG.baseUrl}`);

// In-flight request tracking to prevent duplicates (particularly important with React StrictMode)
const pendingRequests = new Map();
const completedRequests = new Map();

/**
 * Generates a deterministic request ID from request parameters
 * This ensures the same logical request (even if called twice by StrictMode) gets the same ID
 */
function generateRequestId(endpoint, method, body) {
  // Create a stable string representation of the body
  const bodyStr = body ? JSON.stringify(body) : '';
  // Create a composite key for the request
  const requestKey = `${endpoint}|${method}|${bodyStr}`;
  // Use a hash function for shorter ID (simple implementation)
  return requestKey;
}

/**
 * Check if a request is already in progress or has been completed recently
 * @returns {Object} status object with inProgress and recentlyCompleted flags
 */
function checkRequestStatus(requestId) {
  const now = Date.now();
  const inProgress = pendingRequests.has(requestId);
  
  // Check if we have a recently completed request (within last 500ms)
  const recentCompletion = completedRequests.get(requestId);
  const recentlyCompleted = recentCompletion && (now - recentCompletion.timestamp) < 500;
  
  return { inProgress, recentlyCompleted };
}

/**
 * Creates a shared promise that can be reused for duplicate requests
 * 
 * @param {function} promiseFn - The function that returns a promise
 * @param {string} requestId - The ID to track this request
 * @returns {Promise} - A shared promise that resolves to the result
 */
function createSharedPromise(promiseFn, requestId) {
  // Create a promise that we can reuse for duplicate requests
  const promise = promiseFn();
  
  // Register this promise so it can be reused by duplicate requests
  registerPendingRequest(requestId, promise);
  
  // When the promise resolves or rejects, mark the request as completed
  promise
    .then(result => {
      completeRequest(requestId, true, { data: result });
      return result;
    })
    .catch(error => {
      completeRequest(requestId, false);
      throw error;
    });
  
  return promise;
}

/**
 * Register a request as in-progress
 * @param {string} requestId - The ID of the request
 * @param {Promise} promise - Optional promise to store with the request
 */
function registerPendingRequest(requestId, promise = null) {
  pendingRequests.set(requestId, {
    timestamp: Date.now(),
    promise: promise
  });
}

/**
 * Mark a request as completed
 * 
 * @param {string} requestId - The ID of the request
 * @param {boolean} success - Whether the request completed successfully
 * @param {Object} result - The result data to cache (optional)
 */
function completeRequest(requestId, success = true, result = null) {
  pendingRequests.delete(requestId);
  
  // Store both timestamp and data for successful requests
  completedRequests.set(requestId, {
    timestamp: Date.now(),
    success,
    data: result?.data || null
  });
  
  // Clean up completed requests older than 2 seconds to prevent memory leaks
  const now = Date.now();
  for (const [id, entry] of completedRequests.entries()) {
    if (now - entry.timestamp > 2000) {
      completedRequests.delete(id);
    }
  }
}

// Cleanup interval for pendingRequests to prevent memory leaks (abandoned requests)
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of pendingRequests.entries()) {
    // Clean up requests older than 30 seconds (likely abandoned/failed)
    if (now - entry.timestamp > 30000) {
      pendingRequests.delete(id);
    }
  }
},
60000); // Run cleanup every minute

/**
 * Simulates network latency for mock functions
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates mock resume analysis data based on provided resume data
 * In a real implementation, this would be handled by an AI model
 * 
 * @param {Object} resumeData - The resume data to analyze 
 * @returns {Object} Mock analysis data
 */
const generateMockAnalysis = (resumeData) => {
  // Extract job titles and skills from resume data to personalize the mock analysis
  const jobTitles = resumeData.bullet_points.map(job => job.position || "Unknown Position");
  const companies = resumeData.bullet_points.map(job => job.company || "Unknown Company");
  
  // Generate personalized job titles if available
  const latestPosition = jobTitles[0] || "Software Developer";
  
  // Simulated skills extraction - in a real implementation this would be done by AI
  const extractedSkills = [];
  const achievements = [];
  
  // Extract potential skills from bullet points
  resumeData.bullet_points.forEach(job => {
    if (job.achievements) {
      job.achievements.forEach(bullet => {
        // Look for technical terms
        const techTerms = [
          "JavaScript", "React", "Node.js", "Python", "Java", "C#", 
          "AWS", "Azure", "Cloud", "Docker", "Kubernetes", "CI/CD",
          "SQL", "NoSQL", "MongoDB", "PostgreSQL", "Database",
          "API", "REST", "GraphQL", "UI/UX", "Design", "Agile", "Scrum"
        ];
        
        techTerms.forEach(term => {
          if (bullet.includes(term) && !extractedSkills.includes(term)) {
            extractedSkills.push(term);
          }
        });
        
        // Look for achievement indicators
        if (bullet.match(/increased|improved|reduced|saved|achieved|delivered|launched|implemented/i)) {
          achievements.push(bullet);
        }
      });
    }
  });
  
  // Generate ATS keywords based on job title and extracted skills
  const allPossibleKeywords = [
    "JavaScript", "React", "Angular", "Vue.js", "Node.js", "Express", 
    "Python", "Django", "Flask", "Java", "Spring", "C#", ".NET",
    "AWS", "Azure", "GCP", "Cloud Architecture", "Docker", "Kubernetes",
    "DevOps", "CI/CD", "Jenkins", "GitHub Actions", "Agile", "Scrum",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "Database Design",
    "REST API", "GraphQL", "Microservices", "System Design",
    "UI/UX", "Figma", "Sketch", "Adobe XD", "Mobile Development",
    "Project Management", "Team Leadership", "Technical Writing"
  ];
  
  // Determine which keywords are already present in the resume
  const presentKeywords = [];
  const missingKeywords = [];
  
  // Check which keywords are present in the resume
  allPossibleKeywords.forEach(keyword => {
    let isPresent = false;
    
    // Check if the keyword appears in any bullet point
    resumeData.bullet_points.forEach(job => {
      if (job.achievements) {
        job.achievements.forEach(bullet => {
          if (bullet.toLowerCase().includes(keyword.toLowerCase())) {
            isPresent = true;
          }
        });
      }
    });
    
    if (isPresent) {
      presentKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });
  
  // Generate ATS keywords list with presence status and priority
  const generateAtsKeywords = () => {
    const atsKeywords = [];
    
    // Add present keywords (3-5)
    const presentCount = Math.min(presentKeywords.length, 5);
    for (let i = 0; i < presentCount; i++) {
      atsKeywords.push({
        keyword: presentKeywords[i],
        present: true,
        priority: i < 2 ? "High" : "Medium"
      });
    }
    
    // Add missing keywords (8-10)
    const missingCount = Math.min(missingKeywords.length, 10);
    for (let i = 0; i < missingCount; i++) {
      atsKeywords.push({
        keyword: missingKeywords[i],
        present: false,
        priority: i < 3 ? "High" : i < 6 ? "Medium" : "Low"
      });
    }
    
    return atsKeywords;
  };
  
  return {
    success: true,
    strengths: [
      `Strong background in ${extractedSkills.slice(0, 3).join(", ") || "technical skills"}`,
      achievements.length > 0 ? "Demonstrated success in delivering measurable results" : "Experience across multiple projects and responsibilities",
      companies.length > 1 ? "Diverse experience across multiple organizations" : "Focused expertise in your industry"
    ],
    weaknesses: [
      "Limited quantifiable achievements and metrics in bullet points",
      "Some bullet points focus on responsibilities rather than accomplishments",
      "Could better highlight leadership and initiative"
    ],
    areasForImprovement: [
      "Add more specific metrics and quantifiable results to demonstrate impact",
      "Focus on achievements rather than just listing responsibilities",
      "Highlight problem-solving skills and specific challenges overcome"
    ],
    missingSkills: [
      "Project management methodologies (Agile, Scrum)",
      "Data analysis and visualization skills",
      "Leadership and team management experience"
    ],
    recommendedRoles: [
      latestPosition,
      latestPosition.includes("Developer") ? "Full Stack Engineer" : "Technical Lead",
      latestPosition.includes("Front") ? "UI/UX Developer" : "Software Architect", 
      "Technical Project Manager"
    ],
    topIndustries: [
      {
        name: "Technology",
        match: "High",
        keySkills: extractedSkills.length > 0 ? extractedSkills.slice(0, 4) : ["JavaScript", "React", "Node.js", "Cloud Services"]
      },
      {
        name: "Financial Services",
        match: "Medium",
        keySkills: ["Data Analysis", "Security Compliance", "API Integration"]
      },
      {
        name: "E-commerce",
        match: "High",
        keySkills: ["UI/UX", "Payment Systems", "Web Development"]
      },
      {
        name: "Healthcare IT",
        match: "Medium",
        keySkills: ["Data Security", "System Integration", "Compliance"]
      }
    ],
    companies: {
      major: [
        "Google",
        "Microsoft",
        "Amazon",
        "Apple",
        "Meta",
        "IBM",
        "Salesforce",
        "Adobe",
        "Oracle",
        "Shopify"
      ],
      promising: [
        "Databricks",
        "Notion",
        "Vercel",
        "Figma",
        "HashiCorp",
        "Airtable",
        "Confluent",
        "GitLab",
        "Retool",
        "Supabase"
      ]
    },
    atsKeywords: generateAtsKeywords()
  };
};

/**
 * Request rate limiter implementation 
 * Uses the token bucket algorithm for rate limiting
 */
class RateLimiter {
  /**
   * Create a new rate limiter
   * 
   * @param {number} maxRequests - Maximum number of requests allowed in the time window
   * @param {number} timeWindow - Time window in milliseconds
   */
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requestTimestamps = [];
    this.initialized = false;
    this.lastWarningTime = 0;
  }

  /**
   * Initialize the rate limiter
   * This is done lazily to avoid unnecessary initialization in test environments
   */
  initialize() {
    if (!this.initialized) {
      this.initialized = true;
      this.requestTimestamps = [];
      console.log(`Rate limiter initialized: ${this.maxRequests} requests per ${this.timeWindow/1000}s`);
    }
  }

  /**
   * Get a token for making a request
   * If no tokens are available, waits until one becomes available
   * 
   * @returns {Promise<boolean>} - Resolves to true when a token is acquired
   */
  async acquireToken() {
    this.initialize();
    const now = Date.now();
    
    // Remove timestamps outside the current time window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    // If we've hit the limit, wait until a token becomes available
    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.timeWindow - (now - oldestTimestamp);
      
      // Avoid spamming the console with warnings
      if (now - this.lastWarningTime > 5000) {
        console.warn(`Rate limit reached. Waiting ${waitTime}ms before retrying...`);
        this.lastWarningTime = now;
      }
      
      await delay(waitTime);
      return this.acquireToken(); // Recursive call after waiting
    }
    
    // Add the current timestamp to the list
    this.requestTimestamps.push(now);
    return true;
  }
  
  /**
   * Get the number of available tokens
   * 
   * @returns {number} - Number of available tokens
   */
  getAvailableTokens() {
    const now = Date.now();
    
    // Remove timestamps outside the current time window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    return Math.max(0, this.maxRequests - this.requestTimestamps.length);
  }
}

// Initialize the rate limiter with configuration
const rateLimiter = new RateLimiter(
  API_CONFIG.rateLimitRequests,
  API_CONFIG.rateLimitPeriod
);

/**
 * Base API request function with robust retry logic and support for long-running operations
 * Implements advanced error handling, rate limiting, and retry patterns
 * 
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method
 * @param {Object|null} options.body - Request body
 * @param {Object} options.headers - Request headers
 * @param {number} options.timeout - Request timeout in ms
 * @param {boolean} options.useRateLimit - Whether to use rate limiting
 * @param {boolean} options.cacheable - Whether the request can be cached
 * @param {boolean} options.longRunning - Whether this is a long-running operation that requires polling
 * @param {Function} options.onPollStatus - Callback for status updates during polling
 * @returns {Promise<any>} - Promise that resolves to response data
 */
async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = API_CONFIG.timeout,
    useRateLimit = true,
    cacheable = false,
    longRunning = false,
    onPollStatus = null,
    skipDedupe = false // Option to skip deduplication for rare cases
  } = options;
  
  // Generate a deterministic request ID based on the request parameters
  const deterministicRequestId = generateRequestId(endpoint, method, body);
  
  // Check for duplicate requests (unless explicitly skipped)
  if (!skipDedupe) {
    const { inProgress, recentlyCompleted } = checkRequestStatus(deterministicRequestId);
    
    if (inProgress) {
      console.log(`Duplicate API request prevented for ${method} ${endpoint}`);
      
      // Get the pending request and create a promise that will resolve when it completes
      const pendingRequest = pendingRequests.get(deterministicRequestId);
      if (typeof pendingRequest === 'object' && pendingRequest.promise) {
        console.log(`Reusing existing promise for ${method} ${endpoint}`);
        return pendingRequest.promise;
      }
      
      // If we don't have the promise stored (legacy case), wait for the request to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!pendingRequests.has(deterministicRequestId)) {
            clearInterval(checkInterval);
            
            // If request completed successfully, we should have its result
            const recentResult = completedRequests.get(deterministicRequestId);
            if (recentResult && recentResult.data) {
              console.log(`Using result from concurrent request for ${method} ${endpoint}`);
              resolve(recentResult.data);
            } else {
              // Something went wrong with the original request
              reject(new Error('Concurrent request failed'));
            }
          }
        }, 100);
        
        // Set a timeout in case the original request never completes
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Timed out waiting for concurrent request'));
        }, timeout);
      });
    }
    
    if (recentlyCompleted) {
      console.log(`Request ${method} ${endpoint} was just completed, throttling duplicate`);
      const recentResult = completedRequests.get(deterministicRequestId);
      if (recentResult && recentResult.data) {
        return recentResult.data;
      }
    }
  }
  
  // Apply rate limiting if required
  if (useRateLimit) {
    await rateLimiter.acquireToken();
  }

  // Only use mock data if explicitly configured
  if (API_CONFIG.useMockData) {
    return createSharedPromise(async () => {
      return await mockApiRequest(endpoint, { method, body });
    }, deterministicRequestId);
  }
  
  // For real API requests, create a shared promise
  return createSharedPromise(async () => {
    // For real API calls, implement retry logic
    let attempts = 0;
    let lastError = null;
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  
    console.log(`[${requestId}] API Request: ${method} ${endpoint}`);
    const startTime = Date.now();
  
    while (attempts < API_CONFIG.retryAttempts) {
      try {
        // Set up request timeout with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn(`[${requestId}] Request timeout after ${timeout}ms`);
        }, timeout);
  
        // Make the API request
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            ...headers,
          },
          body: body ? JSON.stringify(body) : null,
          signal: controller.signal,
        });
  
        // Clear the timeout
        clearTimeout(timeoutId);
  
        // Handle non-successful responses
        if (!response.ok) {
          let errorMessage;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message || `API request failed with status ${response.status}`;
          } catch (parseError) {
            errorMessage = `API request failed with status ${response.status}`;
          }
          
          // Log error details
          console.error(`[${requestId}] API Error:`, {
            status: response.status,
            statusText: response.statusText,
            endpoint,
            message: errorMessage
          });
          
          // Special case for 5xx errors - retry with backoff
          if (response.status >= 500) {
            // Get retry delay from headers if available, or use exponential backoff
            let retryAfter = response.headers.get('retry-after');
            let delay;
            
            if (retryAfter) {
              delay = parseInt(retryAfter, 10) * 1000; // Convert to ms
            } else {
              // Exponential backoff with jitter
              const jitter = Math.random() * 300;
              delay = Math.min(API_CONFIG.retryDelay * Math.pow(2, attempts) + jitter, 15000);
            }
            
            console.log(`[${requestId}] Server error (${response.status}), retrying after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempts++;
            continue;
          }
          
          throw new Error(errorMessage);
        }
  
        // Parse response
        let responseData;
        try {
          responseData = await response.json();
        } catch (error) {
          console.error(`[${requestId}] Error parsing response:`, error);
          throw new Error('Invalid response format from server');
        }
        
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] API Response: ${method} ${endpoint} (${duration}ms)`);
        
        // Handle 202 Accepted responses for long-running processes (async processing)
        if (response.status === 202 && responseData.requestId && responseData.statusEndpoint) {
          if (longRunning) {
            console.log(`[${requestId}] Long-running task started with ID: ${responseData.requestId}`);
            return await pollRequestStatus(responseData.requestId, responseData.statusEndpoint, { onPollStatus });
          } else {
            // If caller doesn't expect long-running, return the initial response
            console.log(`[${requestId}] Returning 202 Accepted response without polling`);
            return responseData;
          }
        }
        
        // Regular successful response
        return responseData;
      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = error;
        attempts++;
        
        // Log the error with request context
        console.error(`[${requestId}] Request failed (attempt ${attempts}/${API_CONFIG.retryAttempts}, ${duration}ms):`, 
          error.name === 'AbortError' ? 'Request timeout' : error.message
        );
        
        // Don't retry if we've reached the max attempts
        if (attempts >= API_CONFIG.retryAttempts) {
          console.error(`[${requestId}] Max retry attempts reached`);
          break;
        }
        
        // Implement exponential backoff with jitter for retries
        const jitter = Math.random() * 300;
        const backoffTime = (API_CONFIG.retryDelay * Math.pow(2, attempts - 1)) + jitter;
        console.warn(`[${requestId}] Retrying in ${Math.round(backoffTime)}ms...`);
        await delay(backoffTime);
      }
    }
  
    // If we've exhausted all retries, throw the last error
    throw lastError;
  }, deterministicRequestId);
}

/**
 * Poll for the status of a long-running request
 * 
 * @param {string} requestId - The ID of the request
 * @param {string} statusEndpoint - The endpoint to poll for status
 * @param {Object} options - Optional settings
 * @param {Function} options.onPollStatus - Callback for status updates during polling
 * @returns {Promise<any>} - The final result of the request
 */
async function pollRequestStatus(requestId, statusEndpoint, options = {}) {
  console.log(`Polling for request status: ${requestId}`);
  
  const { onPollStatus = null } = options;
  
  // Polling configuration
  const MAX_POLLS = 30; // Maximum number of polling attempts
  const INITIAL_POLL_INTERVAL = 1000; // Start with 1s interval
  const MAX_POLL_INTERVAL = 5000; // Don't poll slower than every 5s
  
  let pollCount = 0;
  let pollInterval = INITIAL_POLL_INTERVAL;
  
  while (pollCount < MAX_POLLS) {
    // Wait before polling (except for first poll)
    if (pollCount > 0) {
      await delay(pollInterval);
      
      // Gradually increase the polling interval (up to MAX_POLL_INTERVAL)
      pollInterval = Math.min(pollInterval * 1.5, MAX_POLL_INTERVAL);
    }
    
    pollCount++;
    console.log(`Poll ${pollCount}/${MAX_POLLS} for request ${requestId}`);
    
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${statusEndpoint}`);
      
      if (!response.ok) {
        console.error(`Status poll failed: ${response.status} ${response.statusText}`);
        
        // Notify listener of error if provided
        if (onPollStatus) {
          onPollStatus({
            status: 'error',
            error: `Status poll failed: ${response.status} ${response.statusText}`
          });
        }
        
        continue;
      }
      
      const statusData = await response.json();
      
      // Notify status update listener if provided
      if (onPollStatus) {
        onPollStatus(statusData);
      }
      
      // Check status and return completed results
      if (statusData.status === 'completed') {
        console.log(`Request ${requestId} completed successfully`);
        
        // If results are included in the status response, return them
        if (statusData.result) {
          return statusData.result;
        }
        
        // Otherwise, fetch the results separately
        console.log(`Fetching results for completed request ${requestId}`);
        const resultResponse = await fetch(`${API_CONFIG.baseUrl}/api/request-result/${requestId}`);
        
        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultResponse.status} ${resultResponse.statusText}`);
        }
        
        return await resultResponse.json();
      }
      
      // If the request failed, stop polling and throw an error
      if (statusData.status === 'failed') {
        const errorMsg = `Request failed: ${statusData.error || 'Unknown error'}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // For any other status, log progress and continue polling
      console.log(`Request ${requestId} status: ${statusData.status}, progress: ${statusData.progress}%`);
    } catch (error) {
      console.error(`Error polling for status: ${error.message}`);
      
      // Notify listener of error if provided
      if (onPollStatus) {
        onPollStatus({
          status: 'error',
          error: error.message
        });
      }
      
      // Don't stop polling on error, just continue with the next poll
      // unless we've hit the maximum number of polls
      if (pollCount >= MAX_POLLS) {
        throw error;
      }
    }
  }
  
  // If we've exceeded the maximum number of polls, throw an error
  const timeoutError = `Polling timed out after ${MAX_POLLS} attempts`;
  console.error(timeoutError);
  
  // Final notification to listener
  if (onPollStatus) {
    onPollStatus({
      status: 'timeout',
      error: timeoutError
    });
  }
  
  throw new Error(timeoutError);
}

/**
 * Mock implementation of API requests for development/testing
 * 
 * @param {string} endpoint 
 * @param {Object} options 
 * @returns {Promise<any>}
 */
async function mockApiRequest(endpoint, options) {
  // Simulate network latency
  await delay(800);

  const { method, body } = options;

  // Mock different API endpoints
  switch (true) {
    case endpoint.endsWith('/resume/parse'):
      return mockParseResume(body);
    case endpoint.endsWith('/resume/improve'):
      return mockImproveResume(body);
    case endpoint.endsWith('/resume/export'):
      return mockExportResume(body);
    case endpoint.endsWith('/resume/analyze'):
      return mockAnalyzeResume(body?.resumeData);
    case endpoint.endsWith('/resume/improvement-analytics'):
      return mockImprovementAnalytics(body);
    default:
      throw new Error(`Unrecognized endpoint: ${endpoint}`);
  }
}

/**
 * Mock function for resume parsing
 * Returns extracted bullet points from an uploaded resume
 */
function mockParseResume() {
  return {
    success: true,
    bulletPoints: [
      "Developed and maintained web applications using React and Node.js",
      "Increased website performance by 40% through optimization techniques",
      "Collaborated with cross-functional teams to deliver projects on time"
    ]
  };
}

/**
 * Mock function for AI resume improvements
 * Returns improved bullet points with reasoning and follow-up questions
 */
function mockImproveResume(data) {
  const { bulletPoint, additionalContext = "" } = data;
  
  // If specific bullet point and context are provided, customize response
  if (bulletPoint && additionalContext) {
    // Create sample bullet point variations
    const sampleText = "Engineered high-performance web applications using React and Node.js, implementing optimization techniques that boosted website speed by 40% and enhanced user experience";
    
    return {
      success: true,
      multipleSuggestions: [
        sampleText,
        "Developed React and Node.js web applications with a focus on performance, delivering a 40% speed improvement that significantly increased user engagement",
        "Architected and implemented performance enhancements for web applications using React and Node.js, reducing load times by 40% across all platforms"
      ],
      improvedBulletPoint: sampleText,
      reasoning: "The improved versions use stronger action verbs, quantify achievements, highlight specific technologies, and emphasize the impact. Each variation presents a slightly different focus while maintaining conciseness.",
      followUpQuestions: [
        "Can you provide more details about the specific optimization techniques used?",
        "Were there any particular challenges you faced during this project?",
        "How many users were impacted by this performance improvement?"
      ]
    };
  }
  
  // Default generic response
  const defaultImprovement = "Engineered and maintained web applications using React and Node.js, implementing best practices for code organization and performance";
  
  return {
    success: true,
    multipleSuggestions: [
      defaultImprovement,
      "Developed responsive React applications with Node.js backends, following industry best practices for maintainable and efficient code",
      "Built and maintained full-stack web solutions with React and Node.js, focusing on performance optimization and clean architecture"
    ],
    improvedBulletPoint: defaultImprovement,
    reasoning: "Used stronger action verbs and highlighted technical skills while emphasizing best practices",
    followUpQuestions: [
      "What specific features did you implement?",
      "What was the impact of your work?",
      "What challenges did you face?"
    ]
  };
}

/**
 * Mock function for resume export
 */
function mockExportResume(data) {
  const { bulletPoints } = data;
  
  return {
    success: true,
    downloadUrl: "mock-resume-download-url.pdf",
    exportedBulletPoints: bulletPoints
  };
}

/**
 * Mock function for resume analysis
 * Returns a comprehensive analysis of the resume
 */
function mockAnalyzeResume(resumeData) {
  return generateMockAnalysis(resumeData);
}

/**
 * Mock function for resume improvement analytics
 * Provides recommendations based on the improvements made so far
 */
function mockImprovementAnalytics(data) {
  const { resumeData, improvements, savedBullets } = data;
  
  return {
    success: true,
    generalImprovements: [
      "Add more quantifiable achievements with specific metrics (numbers, percentages, dollar amounts)",
      "Ensure all bullet points start with powerful action verbs that showcase your initiative",
      "Highlight technical skills that are most relevant to your target roles",
      "Connect your achievements to business outcomes and demonstrate your impact",
      "Remove unnecessary words and phrases for clarity and conciseness",
      "Tailor your bullet points to mirror the language used in job descriptions",
      "Add more industry-specific keywords for better ATS optimization"
    ],
    missingConcepts: [
      {
        category: "Leadership & Management",
        skills: [
          {
            name: "Mentorship & Team Development",
            recommendation: "Add examples of how you've mentored team members, provided training, or helped colleagues develop new skills."
          },
          {
            name: "Strategic Planning & Vision",
            recommendation: "Include instances where you've contributed to strategic initiatives, long-term planning, or helped shape the direction of projects."
          },
          {
            name: "Cross-functional Leadership",
            recommendation: "Highlight your ability to work across departments, align diverse teams, and lead initiatives that span multiple areas of the business."
          }
        ]
      },
      {
        category: "Process Excellence & Innovation",
        skills: [
          {
            name: "Process Automation",
            recommendation: "Describe how you've automated manual processes, implemented tools, or created systems that improved efficiency."
          },
          {
            name: "Continuous Improvement",
            recommendation: "Show how you've identified opportunities for improvement, implemented changes, and measured results."
          },
          {
            name: "Innovation & Problem Solving",
            recommendation: "Highlight creative solutions you've developed to address complex challenges or improve existing systems."
          }
        ]
      },
      {
        category: "Business Impact & Value Creation",
        skills: [
          {
            name: "Revenue Growth & Business Development",
            recommendation: "Include ways you've contributed to revenue growth, new business opportunities, or customer acquisition/retention."
          },
          {
            name: "Cost Reduction & Efficiency",
            recommendation: "Detail how your work has led to cost savings, better resource utilization, or improved ROI."
          },
          {
            name: "Stakeholder Management",
            recommendation: "Add examples of how you've effectively managed relationships with internal and external stakeholders."
          }
        ]
      }
    ],
    aiInsights: [
      "Your resume would benefit from more emphasis on leadership skills, even if you're not in a management position",
      "Consider adding more examples that demonstrate your problem-solving approach rather than just listing responsibilities",
      "Your strongest achievements focus on technical implementation - balance this with business impact statements",
      "Many recruiters look for candidates who can bridge technical expertise with business understanding - highlight this skill",
      "Most job descriptions now emphasize collaboration and teamwork - make sure your resume reflects these soft skills"
    ]
  };
}

/**
 * ResumeAPI client - provides methods for interacting with the Resume Improvement API
 */
export const ResumeAPI = {
  /**
   * Parse a resume file to extract bullet points
   * 
   * @param {File} file - The resume file (PDF, DOC, DOCX)
   * @returns {Promise<{success: boolean, bulletPoints: string[]}>}
   * 
   * Expected API Endpoint: POST /api/v1/resume/parse
   * Content-Type: multipart/form-data
   */
  async parseResume(file) {
    try {
      if (API_CONFIG.useMockData) {
        // Mock implementation
        console.log("Using mock data for resume parsing");
        return apiRequest('/api/v1/resume/parse', {
          method: 'POST',
          body: { filename: file.name }
        });
      }
      
      // For testing - call the test endpoint
      // This is helpful if file upload isn't working
      // Comment this out in production
      // try {
      //   console.log("Using test endpoint for resume parsing");
      //   const testResponse = await fetch(`${API_CONFIG.baseUrl}/api/v1/resume/parse/test`);
      //   if (testResponse.ok) {
      //     return await testResponse.json();
      //   }
      // } catch (testError) {
      //   console.log("Test endpoint failed, trying actual file upload");
      // }
      
      // Read file content using FileReader
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
      
      console.log("File read successfully, content length:", fileContent.length);
      
      // Send the file content to the server API
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('resumeText', fileContent);
      
      console.log("FormData created with file and resumeText");
      
      // Make the API call without using the apiRequest helper
      // since we need to use FormData
      console.log("Sending request to:", `${API_CONFIG.baseUrl}/api/v1/resume/parse`);
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/resume/parse`, {
        method: 'POST',
        body: formData,
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response data:", errorData);
        throw new Error(
          errorData?.message || `API request failed with status ${response.status}`
        );
      }
      
      const responseData = await response.json();
      console.log("Response data:", responseData);
      return responseData;
    } catch (error) {
      console.error('Failed to parse resume:', error);
      throw new Error('Failed to parse resume. Please try again or upload a different file.');
    }
  },

  /**
   * Get AI-powered comprehensive resume analysis
   * 
   * @param {Object} resumeData - Structured resume data with bullet points
   * @param {Object} options - Optional settings
   * @param {boolean} options.longRunning - Whether to treat as a long-running operation
   * @param {Function} options.onStatusUpdate - Callback for status updates during polling
   * @returns {Promise<{
   *   strengths: string[],
   *   weaknesses: string[],
   *   areasForImprovement: string[],
   *   missingSkills: string[],
   *   recommendedRoles: string[],
   *   topIndustries: Array<{name: string, match: string, keySkills: string[]}>,
   *   companies: {major: string[], promising: string[]}
   * }>}
   * 
   * Expected API Endpoint: POST /api/v1/resume/analyze
   * Content-Type: application/json
   */
  async analyzeResume(resumeData, options = {}) {
    const { longRunning = false, onStatusUpdate = null } = options;
    
    try {
      if (API_CONFIG.useMockData) {
        console.log("Using mock data for resume analysis");
        
        // If we have a status update callback, simulate progress updates
        if (onStatusUpdate) {
          // Simulate progress updates
          onStatusUpdate({ status: 'starting', progress: 10 });
          await delay(800);
          onStatusUpdate({ status: 'processing', progress: 30 });
          await delay(700);
          onStatusUpdate({ status: 'processing', progress: 60 });
          await delay(500);
          onStatusUpdate({ status: 'finalizing', progress: 90 });
          await delay(300);
          onStatusUpdate({ status: 'completed', progress: 100 });
        } else {
          // Just a basic delay if no progress callback
          await delay(1500);
        }
        
        // Generate mock analysis based on the resume data
        const mockAnalysis = generateMockAnalysis(resumeData);
        return mockAnalysis;
      }
      
      // Real API implementation - use the robust apiRequest function
      console.log("Sending resume data to analysis API...");
      return await apiRequest('/api/v1/resume/analyze', {
        method: 'POST',
        body: { resumeData },
        longRunning,
        timeout: 60000, // 60 second timeout for analysis requests
        
        // Custom polling handler to provide progress updates
        onPollStatus: longRunning && onStatusUpdate ? (statusData) => {
          onStatusUpdate({
            status: statusData.status,
            progress: statusData.progress || 0,
            error: statusData.error
          });
        } : null
      });
    } catch (error) {
      console.error('Failed to get resume analysis:', error);
      throw new Error('Failed to generate resume analysis. Please try again later.');
    }
  },
  
  /**
   * Get AI-powered improvement recommendations based on the improvements made so far
   * 
   * @param {Object} resumeData - Structured resume data with bullet points
   * @param {Object} improvements - Object containing improved bullet points
   * @param {Object} savedBullets - Object tracking which bullets have been saved
   * @returns {Promise<{
   *   generalImprovements: string[],
   *   missingConcepts: Array<{
   *     category: string,
   *     skills: Array<{
   *       name: string,
   *       recommendation: string
   *     }>
   *   }>,
   *   aiInsights: string[]
   * }>}
   * 
   * Expected API Endpoint: POST /api/v1/resume/improvement-analytics
   * Content-Type: application/json
   */
  async getImprovementAnalytics(resumeData, improvements, savedBullets, options = {}) {
    const { longRunning = false, onStatusUpdate = null } = options;
    
    try {
      if (API_CONFIG.useMockData) {
        console.log("Using mock data for improvement analytics");
        
        // If we have a status update callback, simulate progress updates
        if (onStatusUpdate) {
          // Simulate progress updates
          onStatusUpdate({ status: 'starting', progress: 10 });
          await delay(500);
          onStatusUpdate({ status: 'processing', progress: 30 });
          await delay(600);
          onStatusUpdate({ status: 'analyzing_improvements', progress: 60 });
          await delay(500);
          onStatusUpdate({ status: 'finalizing', progress: 90 });
          await delay(400);
          onStatusUpdate({ status: 'completed', progress: 100 });
        } else {
          // Just a basic delay if no progress callback
          await delay(2000);
        }
        
        // Use our mock implementation that takes the same params for consistency
        return mockImprovementAnalytics({ resumeData, improvements, savedBullets });
      }
      
      // Real API implementation using our robust apiRequest function
      console.log("Sending data to improvement analytics API...");
      return await apiRequest('/api/v1/resume/improvement-analytics', {
        method: 'POST',
        body: { resumeData, improvements, savedBullets },
        longRunning,
        timeout: 60000, // 60 second timeout for analytics
        
        // Custom polling handler to provide progress updates
        onPollStatus: longRunning && onStatusUpdate ? (statusData) => {
          onStatusUpdate({
            status: statusData.status,
            progress: statusData.progress || 0,
            error: statusData.error
          });
        } : null
      });
    } catch (error) {
      console.error('Failed to get improvement analytics:', error);
      throw new Error('Failed to generate improvement recommendations. Please try again later.');
    }
  },

  /**
   * Get AI-powered improvements for a resume bullet point
   * 
   * @param {string} bulletPoint - Original bullet point text
   * @param {string} additionalContext - Additional context provided by user
   * @returns {Promise<{
   *   success: boolean,
   *   improvedBulletPoint: string,
   *   reasoning: string,
   *   remainingWeaknesses: string,
   *   followUpQuestions: string[]
   * }>}
   * 
   * Expected API Endpoint: POST /api/v1/resume/improve
   * Content-Type: application/json
   */
  async getAISuggestions(bulletPoint, additionalContext = "") {
    try {
      if (API_CONFIG.useMockData) {
        // Use mock implementation
        return apiRequest('/api/v1/resume/improve', {
          method: 'POST',
          body: { bulletPoint, additionalContext }
        });
      }
      
      // Call the server API
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/resume/improve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bulletPoint, additionalContext }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `API request failed with status ${response.status}`
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      throw new Error('Failed to generate AI suggestions. Please try again later.');
    }
  },

  /**
   * Export an improved resume for download
   * 
   * @param {string[]} bulletPoints - Array of improved bullet points
   * @param {Object} options - Export options
   * @param {string} options.format - Export format (pdf, docx)
   * @param {string} options.template - Resume template to use
   * @returns {Promise<{success: boolean, downloadUrl: string}>}
   * 
   * Expected API Endpoint: POST /api/v1/resume/export
   * Content-Type: application/json
   */
  async exportResume(bulletPoints, options = { format: 'pdf', template: 'modern' }) {
    try {
      if (API_CONFIG.useMockData) {
        return apiRequest('/api/v1/resume/export', {
          method: 'POST',
          body: { bulletPoints, ...options }
        });
      }
      
      // Call the server API
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/resume/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bulletPoints, ...options }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `API request failed with status ${response.status}`
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to export resume:', error);
      throw new Error('Failed to export resume. Please try again later.');
    }
  }
};

// Create a service factory for better testability and dependency injection
const createResumeAPIService = (config = API_CONFIG) => {
  return {
    ...ResumeAPI,
    getConfig: () => ({ ...config }),
    getRateLimiter: () => rateLimiter
  };
};

// Export the API service factory, prompts, and default instance
export { prompts, createResumeAPIService };
export default ResumeAPI;