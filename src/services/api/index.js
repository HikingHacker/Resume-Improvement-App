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

/**
 * Simulates network latency for mock functions
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Request rate limiter implementation
 */
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requestTimestamps = [];
  }

  async acquireToken() {
    const now = Date.now();
    
    // Remove timestamps outside the current time window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.timeWindow - (now - oldestTimestamp);
      console.warn(`Rate limit reached. Waiting ${waitTime}ms before retrying...`);
      await delay(waitTime);
      return this.acquireToken(); // Recursive call after waiting
    }
    
    this.requestTimestamps.push(now);
    return true;
  }
}

// Initialize the rate limiter
const rateLimiter = new RateLimiter(
  API_CONFIG.rateLimitRequests,
  API_CONFIG.rateLimitPeriod
);

/**
 * Base API request function with retry logic
 * 
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method
 * @param {Object|null} options.body - Request body
 * @param {Object} options.headers - Request headers
 * @param {number} options.timeout - Request timeout in ms
 * @param {boolean} options.useRateLimit - Whether to use rate limiting
 * @returns {Promise<any>} - Promise that resolves to response data
 */
async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = API_CONFIG.timeout,
    useRateLimit = true,
  } = options;

  // Apply rate limiting if required
  if (useRateLimit) {
    await rateLimiter.acquireToken();
  }

  // In mock mode or development, use mock functions
  if (API_CONFIG.useMockData || process.env.NODE_ENV === 'development') {
    // Use mock implementation
    return mockApiRequest(endpoint, { method, body });
  }

  // For real API calls, implement retry logic
  let attempts = 0;
  let lastError = null;

  while (attempts < API_CONFIG.retryAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `API request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      attempts++;
      
      if (attempts >= API_CONFIG.retryAttempts) {
        break;
      }
      
      // Exponential backoff for retries
      const backoffTime = API_CONFIG.retryDelay * Math.pow(2, attempts - 1);
      console.warn(`API request failed. Retrying in ${backoffTime}ms...`, error);
      await delay(backoffTime);
    }
  }

  throw lastError;
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
    return {
      success: true,
      improvedBulletPoint: "Engineered high-performance web applications using React and Node.js, implementing optimization techniques that boosted website speed by 40% and enhanced user experience",
      reasoning: "The improved version uses a stronger action verb (Engineered), quantifies the achievement (40% speed boost), highlights specific technologies (React and Node.js), and emphasizes the impact (enhanced user experience). It's also kept concise within two lines.",
      followUpQuestions: [
        "Can you provide more details about the specific optimization techniques used?",
        "Were there any particular challenges you faced during this project?",
        "How many users were impacted by this performance improvement?"
      ]
    };
  }
  
  // Default generic response
  return {
    success: true,
    improvedBulletPoint: "Engineered and maintained web applications using React and Node.js, implementing best practices for code organization and performance",
    reasoning: "Used stronger action verb and highlighted technical skills",
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
   * Get AI-powered improvements for a resume bullet point
   * 
   * @param {string} bulletPoint - Original bullet point text
   * @param {string} additionalContext - Additional context provided by user
   * @returns {Promise<{
   *   success: boolean,
   *   improvedBulletPoint: string,
   *   reasoning: string,
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

export default ResumeAPI;