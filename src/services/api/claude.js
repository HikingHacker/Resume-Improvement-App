/**
 * Claude API Integration Module
 * 
 * This module provides methods for interacting with Anthropic's Claude AI API for 
 * resume improvement functionality.
 */

import {
  BULLET_IMPROVEMENT_SYSTEM_PROMPT,
  getBulletImprovementPrompt,
  RESUME_PARSER_SYSTEM_PROMPT,
  getResumeParserPrompt
} from './prompts';

// Configuration will be loaded from environment variables 
const CLAUDE_CONFIG = {
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  baseUrl: 'https://api.anthropic.com',
  apiVersion: '2023-06-01',
  model: process.env.REACT_APP_CLAUDE_MODEL || 'claude-3-sonnet-20240229',
  maxTokens: 1000, // Response token limit
  temperature: 0.7, // Controlling randomness
};

// Request tracking for client-side deduplication with React StrictMode
const pendingClientRequests = new Map();

/**
 * Makes a request to Claude API with robust error handling and backoff strategies
 * 
 * @param {Object} options - Request options
 * @param {string} options.prompt - The prompt to send to Claude
 * @param {Object} options.systemPrompt - The system prompt to use
 * @param {number} options.maxTokens - Maximum tokens in response
 * @param {number} options.temperature - Controls randomness (0-1)
 * @returns {Promise<string>} - Promise that resolves to Claude's response
 */
export const callClaudeAPI = async (options) => {
  // Create a unique key for this specific API call
  const requestKey = `${options.prompt?.substring(0, 50)}|${options.systemPrompt?.substring(0, 50)}|${options.maxTokens}|${options.temperature}`;
  
  // Check if this exact request is already in progress
  if (pendingClientRequests.has(requestKey)) {
    console.log("Duplicate Claude API request detected, reusing pending request");
    return pendingClientRequests.get(requestKey);
  }
  
  // Create a promise for this request
  const requestPromise = _executeClaudeRequest(options);
  
  // Store the promise so other duplicate calls can use it
  pendingClientRequests.set(requestKey, requestPromise);
  
  // Once the request completes (whether success or error), remove it from pending
  requestPromise.finally(() => {
    pendingClientRequests.delete(requestKey);
  });
  
  // Return the promise to the caller
  return requestPromise;
};

/**
 * Actual implementation that makes request to Claude API
 * This is separated to allow for the deduplication wrapper above
 */
const _executeClaudeRequest = async (options) => {
  const { 
    prompt, 
    systemPrompt,
    maxTokens = CLAUDE_CONFIG.maxTokens,
    temperature = CLAUDE_CONFIG.temperature,
    requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  } = options;

  if (!CLAUDE_CONFIG.apiKey) {
    console.error('Claude API key is not set. Please add REACT_APP_ANTHROPIC_API_KEY to your environment variables.');
    throw new Error('Claude API key is not configured.');
  }
  
  // Retry configuration
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  const MAX_DELAY = 15000; // 15 seconds
  let attempt = 0;
  
  // Log the start of the request with the provided requestId
  console.log(`[${requestId}] Starting Claude API request`);

  while (attempt <= MAX_RETRIES) {
    try {
      // Log attempt if retrying
      if (attempt > 0) {
        console.log(`[${requestId}] Retry attempt ${attempt}/${MAX_RETRIES}`);
      }
      
      // Configure request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      // Make the API call
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
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] Claude API error:`, errorText);
        
        // Handle different error types with specific retry logic
        const status = response.status;
        
        // Don't retry certain errors (client errors)
        if (status === 400 || status === 401 || status === 403) {
          throw new Error(`Claude API returned error: ${status} ${response.statusText}`);
        }
        
        // For server errors (5xx) and rate limits (429), retry with backoff
        if (status >= 500 || status === 429) {
          if (attempt >= MAX_RETRIES) {
            throw new Error(`Claude API returned error after ${MAX_RETRIES} retries: ${status} ${response.statusText}`);
          }
          
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
          
          console.log(`[${requestId}] Retrying after ${delay}ms due to ${status} error...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        throw new Error(`Claude API returned error: ${status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[${requestId}] Claude API request successful`);
      return data.content[0].text;
    } catch (error) {
      // Special handling for timeouts
      if (error.name === 'AbortError') {
        console.error(`[${requestId}] Request timed out`);
        
        if (attempt >= MAX_RETRIES) {
          throw new Error('Claude API request timed out after multiple attempts');
        }
      } else if (attempt >= MAX_RETRIES) {
        // We've run out of retries
        console.error(`[${requestId}] Final error calling Claude API:`, error);
        throw new Error('Failed to get response from Claude. Please try again later.');
      }
      
      // Calculate backoff time with jitter for network errors and other retryable errors
      const jitter = Math.random() * 300;
      const delay = Math.min(BASE_DELAY * Math.pow(2, attempt) + jitter, MAX_DELAY);
      
      console.log(`[${requestId}] Request failed, retrying after ${delay}ms...`);
      console.error(`[${requestId}] Error:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  // This should not be reached due to the throw in the retry loop,
  // but just in case we hit the maximum retries without an explicit throw
  throw new Error(`Failed after ${MAX_RETRIES} retry attempts`);
};

/**
 * Improves a resume bullet point using Claude AI
 * 
 * @param {string} bulletPoint - Original bullet point
 * @param {string} additionalContext - Additional context about the experience
 * @returns {Promise<Object>} - Improved bullet point data
 */
export const improveBulletPoint = async (bulletPoint, additionalContext = '') => {
  const systemPrompt = BULLET_IMPROVEMENT_SYSTEM_PROMPT;
  const prompt = getBulletImprovementPrompt(bulletPoint, additionalContext);

  try {
    const response = await callClaudeAPI({
      prompt,
      systemPrompt,
      temperature: 0.7, // Slightly higher temperature for more variety
    });

    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Claude');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Make sure we have at least one suggestion, even if the multipleSuggestions array is empty
    let finalSuggestions = parsedResponse.multipleSuggestions || [];
    if (finalSuggestions.length === 0 && parsedResponse.improvedBulletPoint) {
      finalSuggestions = [parsedResponse.improvedBulletPoint];
    }
    
    return {
      success: true,
      multipleSuggestions: finalSuggestions,
      improvedBulletPoint: finalSuggestions[0] || parsedResponse.improvedBulletPoint,
      reasoning: parsedResponse.reasoning,
      remainingWeaknesses: parsedResponse.remainingWeaknesses || "No specific weaknesses identified.",
      followUpQuestions: parsedResponse.followUpQuestions
    };
  } catch (error) {
    console.error('Error improving bullet point:', error);
    throw new Error('Failed to improve the bullet point. Please try again.');
  }
};

/**
 * Parses and extracts bullet points from resume text
 * 
 * Note: In a real implementation, this would use document parsing libraries
 * For now, we'll use Claude to extract bullet points from raw text
 * 
 * @param {string} resumeText - Raw text extracted from a resume
 * @returns {Promise<string[]>} - Array of extracted bullet points
 */
export const extractBulletPoints = async (resumeText) => {
  const systemPrompt = RESUME_PARSER_SYSTEM_PROMPT;
  const prompt = getResumeParserPrompt(resumeText);

  try {
    const response = await callClaudeAPI({
      prompt,
      systemPrompt,
      temperature: 0.2, // More deterministic extraction
    });

    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Claude');
    }

    const bulletPoints = JSON.parse(jsonMatch[0]);
    return bulletPoints;
  } catch (error) {
    console.error('Error extracting bullet points:', error);
    throw new Error('Failed to extract bullet points from the resume. Please try again.');
  }
};

export default {
  improveBulletPoint,
  extractBulletPoints
};