/**
 * Claude API Integration Module
 * 
 * This module provides methods for interacting with Anthropic's Claude AI API for 
 * resume improvement functionality.
 */

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
  const systemPrompt = `
    You are an expert resume writer who helps professionals improve their resume bullet points.
    Your task is to enhance the given bullet point by:
    1. Using stronger action verbs
    2. Highlighting quantifiable achievements
    3. Focusing on impact and results
    4. Making technical skills and technologies stand out
    5. Ensuring conciseness (ideally under 2 lines)
    
    Respond with ONLY a JSON object containing the following fields:
    - multipleSuggestions: An array of 3 distinct improved versions of the bullet point, each offering a different approach or emphasis
    - reasoning: Brief explanation of the improvements you made in general
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
      temperature: 0.6, // Slightly more controlled response
    });

    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Claude');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      multipleSuggestions: parsedResponse.multipleSuggestions || [],
      improvedBulletPoint: parsedResponse.multipleSuggestions ? parsedResponse.multipleSuggestions[0] : parsedResponse.improvedBulletPoint,
      reasoning: parsedResponse.reasoning,
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
  const systemPrompt = `
    You are an expert resume parser. Your task is to extract professional bullet points from a resume.
    Focus on experience, skills, and achievements sections.
    Identify and format each achievement or responsibility as a separate bullet point.
    Return ONLY a JSON array of strings, with each string being a bullet point.
  `;

  const prompt = `
    Here is the resume text:
    "${resumeText}"
    
    Please extract the professional bullet points from this resume.
  `;

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