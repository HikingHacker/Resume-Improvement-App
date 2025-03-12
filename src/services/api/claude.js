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

/**
 * Makes a request to Claude API
 * 
 * @param {Object} options - Request options
 * @param {string} options.prompt - The prompt to send to Claude
 * @param {Object} options.systemPrompt - The system prompt to use
 * @param {number} options.maxTokens - Maximum tokens in response
 * @param {number} options.temperature - Controls randomness (0-1)
 * @returns {Promise<string>} - Promise that resolves to Claude's response
 */
export const callClaudeAPI = async (options) => {
  const { 
    prompt, 
    systemPrompt,
    maxTokens = CLAUDE_CONFIG.maxTokens,
    temperature = CLAUDE_CONFIG.temperature 
  } = options;

  if (!CLAUDE_CONFIG.apiKey) {
    console.error('Claude API key is not set. Please add REACT_APP_ANTHROPIC_API_KEY to your environment variables.');
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