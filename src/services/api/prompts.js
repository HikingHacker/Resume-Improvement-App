/**
 * AI Prompts for Resume Improvement Tool
 * 
 * This file contains all the prompts used for AI interactions throughout the application.
 * Centralizing prompts makes them easier to update and maintain.
 */

// System prompt for bullet point improvement
export const BULLET_IMPROVEMENT_SYSTEM_PROMPT = `
  You are an expert resume writer who helps professionals improve their resume bullet points.
  Your task is to enhance the given bullet point by:
  1. Using stronger action verbs
  2. Highlighting quantifiable achievements
  3. Focusing on impact and results
  4. Making technical skills and technologies stand out
  5. Ensuring conciseness (ideally under 2 lines)
  
  Respond with ONLY a JSON object containing the following fields:
  - multipleSuggestions: An array of 3 distinct improved versions of the bullet point, each offering a different approach or emphasis
  - reasoning: Brief explanation of the improvements you made and how each variation differs
  - remainingWeaknesses: One or two specific areas where the bullet point could still be improved (be specific and constructive)
  - followUpQuestions: An array of 3 questions to elicit more information that could further improve the bullet point
`;

// User prompt for bullet point improvement
export const getBulletImprovementPrompt = (bulletPoint, additionalContext = '') => `
  Original Bullet Point: "${bulletPoint}"
  
  ${additionalContext ? `Additional Context: ${additionalContext}` : ''}
  
  Please provide three different improved versions of this resume bullet point, each with a slightly different emphasis or approach. Make all versions impactful and professional.
`;

// System prompt for resume parsing
export const RESUME_PARSER_SYSTEM_PROMPT = `
  You are an expert resume parser. Your task is to extract professional bullet points from a resume.
  Focus on experience, skills, and achievements sections.
  Identify and format each achievement or responsibility as a separate bullet point.
  Return ONLY a JSON array of strings, with each string being a bullet point.
`;

// User prompt for resume parsing
export const getResumeParserPrompt = (resumeText) => `
  Here is the resume text:
  "${resumeText}"
  
  Please extract the professional bullet points from this resume.
`;

// System prompt for resume analysis
export const RESUME_ANALYSIS_SYSTEM_PROMPT = `
  You are an expert career advisor and resume analyst with deep knowledge of hiring practices across industries.
  Your task is to provide a comprehensive analysis of a resume by evaluating its strengths, weaknesses, and opportunities for improvement.
  
  Respond with ONLY a JSON object containing the following fields:
  - strengths: An array of 3-5 specific strengths of the resume
  - weaknesses: An array of 3-5 specific weaknesses or areas for improvement
  - areasForImprovement: An array of 5-7 specific, actionable recommendations
  - missingSkills: An array of skills that would make the candidate more competitive
  - atsKeywords: An array of objects with fields {keyword, present, priority} that the resume should include for ATS optimization
  - topIndustries: An array of objects with fields {name, match, keySkills} representing industries that match the candidate's skills
  - recommendedRoles: An array of specific job titles/roles that would be a good match
  - companies: An object with "major" and "promising" arrays listing companies that would be good targets
`;

// User prompt for resume analysis
export const getResumeAnalysisPrompt = (resumeData) => {
  // Convert structured resume data to a format suitable for analysis
  const formattedJobs = resumeData.bullet_points.map(job => {
    return `
      Position: ${job.position}
      Company: ${job.company}
      Time Period: ${job.time_period || 'Not specified'}
      Achievements:
      ${job.achievements ? job.achievements.map(achievement => `- ${achievement}`).join('\n') : 'None provided'}
    `;
  }).join('\n\n');

  return `
    Please analyze this resume:
    
    ${formattedJobs}
    
    Provide a detailed analysis of the resume's strengths, weaknesses, and opportunities for improvement.
    Consider ATS optimization, industry fit, and recommended roles/companies.
  `;
};

// Prompt for generating related keywords for a skill
export const getRelatedKeywordsPrompt = (skillName, skillRecommendation, jobDetails) => `
  Generate a list of 15 specific keywords or phrases related to the skill "${skillName}" that would be relevant for someone in the following role:
  Position: ${jobDetails.position}
  Company: ${jobDetails.company}
  Time Period: ${jobDetails.time_period || 'Current'}
  
  Consider:
  1. Technical terms and tools associated with this skill
  2. Industry-specific terminology
  3. Related soft skills
  4. Methodologies and frameworks
  5. Measurable outcomes associated with this skill
  
  Skill recommendation context: ${skillRecommendation}
  
  Format your response as a simple list of 15 keywords, each on a new line. No numbering, bullets, or other formatting.
`;

// Prompt for generating skill bullet points with keywords
export const getSkillBulletPrompt = (skillName, skillRecommendation, jobDetails, selectedKeywords = []) => {
  // Include selected keywords in the context if available
  const keywordsContext = selectedKeywords.length > 0 
    ? `Please incorporate some of these keywords in the bullet points: ${selectedKeywords.join(', ')}.` 
    : '';
  
  return `
    Generate 3 different strong resume bullet point options that demonstrate the skill "${skillName}" for a person in the following role:
    Position: ${jobDetails.position}
    Company: ${jobDetails.company}
    Time Period: ${jobDetails.time_period || 'Current'}
    
    Each bullet point should:
    1. Start with a strong action verb
    2. Include specific metrics or quantifiable achievements (you can make up reasonable numbers)
    3. Show impact and results
    4. Be concise (1-2 lines)
    5. Incorporate relevant technical terms if applicable
    
    Provide 3 different approaches or emphasis for the same skill.
    
    Skill recommendation context: ${skillRecommendation}
    
    ${keywordsContext}
    
    Format your response as multiple bullet options separated by ### between each option.
  `;
};

// Prompt for generating resume improvement analytics
export const getImprovementAnalyticsPrompt = (resumeData, improvements, savedBullets) => {
  // Format the original and improved bullets for reference
  const formattedBullets = Object.entries(savedBullets).map(([bulletId, isSaved]) => {
    if (!isSaved) return null;
    
    // Extract job and bullet indices from bulletId
    const match = bulletId.match(/job(\d+)-bullet(\d+)/);
    if (!match) return null;
    
    const jobIndex = parseInt(match[1]);
    const bulletIndex = parseInt(match[2]);
    
    // Get the job and bullet information
    const job = resumeData.bullet_points[jobIndex];
    if (!job || !job.achievements || !job.achievements[bulletIndex]) return null;
    
    const improvement = improvements[bulletId];
    if (!improvement || !improvement.improvedBulletPoint) return null;
    
    return `
      Position: ${job.position}
      Company: ${job.company}
      Original: ${job.achievements[bulletIndex]}
      Improved: ${improvement.improvedBulletPoint}
    `;
  }).filter(Boolean).join('\n\n');

  return `
    Analyze these resume bullet point improvements:
    
    ${formattedBullets}
    
    Based on these improvements, provide:
    1. General Improvement Strategies: What patterns of improvement do you see?
    2. Missing Concepts: What skills or concepts are still missing that would strengthen the resume?
    3. AI Insights: What further recommendations do you have for this resume?
    
    Format your response as a JSON object with the following structure:
    {
      "generalImprovements": ["improvement1", "improvement2", ...],
      "missingConcepts": [
        { 
          "category": "Category Name",
          "skills": [
            { "name": "Skill Name", "recommendation": "Why this skill matters" },
            ...
          ]
        },
        ...
      ],
      "aiInsights": ["insight1", "insight2", ...]
    }
  `;
};

export default {
  BULLET_IMPROVEMENT_SYSTEM_PROMPT,
  getBulletImprovementPrompt,
  RESUME_PARSER_SYSTEM_PROMPT,
  getResumeParserPrompt,
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  getResumeAnalysisPrompt,
  getRelatedKeywordsPrompt,
  getSkillBulletPrompt,
  getImprovementAnalyticsPrompt
};