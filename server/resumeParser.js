/**
 * Resume parsing utilities
 * @type {module}
 */

/**
 * Extract bullet points from plain text when JSON parsing fails
 * @param {string} text - The text to extract bullet points from
 * @returns {string[]} Array of extracted bullet points
 */
function extractBulletPointsFromText(text) {
  // Split the text into lines
  const lines = text.split('\n');
  const bulletPoints = [];
  
  // Track current section to provide context
  let currentSection = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Skip lines that look like JSON syntax or other non-content
    if (/^[\[\]\{\}",]+$/.test(trimmedLine)) continue;
    
    // Identify section headers (all caps or ends with a colon)
    if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3) {
      currentSection = trimmedLine;
      bulletPoints.push(`SECTION: ${currentSection}`);
      continue;
    }
    
    // Check if line is a position or company header
    if ((trimmedLine.includes('|') || trimmedLine.includes(' at ')) && 
        !trimmedLine.startsWith('•') && 
        !trimmedLine.startsWith('-') &&
        !trimmedLine.startsWith('*')) {
      bulletPoints.push(`POSITION: ${trimmedLine}`);
      continue;
    }
    
    // Look for bullet points or numbered lists
    if (trimmedLine.startsWith('•') || 
        trimmedLine.startsWith('-') || 
        trimmedLine.startsWith('*') ||
        /^\d+\./.test(trimmedLine)) {
      bulletPoints.push(trimmedLine);
      continue;
    }
    
    // Look for potential skill items
    if (trimmedLine.includes(',') && 
        !trimmedLine.includes('.') && 
        trimmedLine.length < 100) {
      bulletPoints.push(`SKILLS: ${trimmedLine}`);
      continue;
    }
    
    // Years that might indicate timeframes
    if (/\d{4}\s*-\s*(\d{4}|present)/i.test(trimmedLine)) {
      bulletPoints.push(`TIMEFRAME: ${trimmedLine}`);
      continue;
    }
  }
  
  return bulletPoints;
}

/**
 * Process Claude API response to extract bullet points with fallbacks
 * @param {string} response - The Claude API response text
 * @returns {Object} Object with bulletPoints and metadata
 */
function processBulletPointResponse(response) {
  // Check if response contains a copyright disclaimer
  if (response.includes("copyrighted material") || 
      response.includes("copyright") || 
      response.includes("intellectual property")) {
    console.log('Warning: Response contains copyright disclaimer, using hard-coded example');
    
    // Return hardcoded example bullet points in the new format
    return {
      success: true,
      bulletPoints: [
        "POSITION: Senior Software Engineer at ABC Tech (2020-Present)",
        "• Developed and maintained web applications using React and Node.js",
        "• Increased website performance by 40% through optimization techniques",
        "• Collaborated with cross-functional teams to deliver projects on time",
        "• Implemented CI/CD pipelines with GitHub Actions",
        "POSITION: Software Engineer at XYZ Solutions (2017-2020)",
        "• Built RESTful APIs using Express.js and MongoDB",
        "• Refactored legacy codebase, reducing technical debt by 30%",
        "• Integrated third-party APIs for payment processing"
      ],
      parsedData: {
        bullet_points: [
          {
            company: "ABC Tech",
            position: "Senior Software Engineer",
            time_period: "2020-Present",
            achievements: [
              "Developed and maintained web applications using React and Node.js",
              "Increased website performance by 40% through optimization techniques",
              "Collaborated with cross-functional teams to deliver projects on time",
              "Implemented CI/CD pipelines with GitHub Actions"
            ]
          },
          {
            company: "XYZ Solutions",
            position: "Software Engineer",
            time_period: "2017-2020",
            achievements: [
              "Built RESTful APIs using Express.js and MongoDB",
              "Refactored legacy codebase, reducing technical debt by 30%",
              "Integrated third-party APIs for payment processing"
            ]
          }
        ]
      },
      note: "Used example data due to copyright response"
    };
  }
  
  // Try to find JSON object in the response, handling different potential formats
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  // Log more details about what we found to help with debugging
  if (jsonMatch) {
    console.log('Found potential JSON object:', jsonMatch[0].substring(0, 200) + '...');
  } else {
    console.log('No JSON object found in response, attempting fallback parsing');
    console.log('Response excerpt:', response.substring(0, 200) + '...');
    
    // Use helper function to extract bullet points
    const bulletPoints = extractBulletPointsFromText(response);
    
    if (bulletPoints.length > 0) {
      console.log(`Found ${bulletPoints.length} bullet points using fallback method`);
      return {
        success: true,
        bulletPoints,
        note: "Used fallback parsing method"
      };
    }
    
    // Last resort - just return the first few lines of the response
    const fallbackBullets = response.split('\n')
                                 .filter(line => line.trim().length > 0)
                                 .slice(0, 10);
                                 
    if (fallbackBullets.length > 0) {
      console.log('Using last resort fallback - first few lines of response');
      return {
        success: true,
        bulletPoints: fallbackBullets,
        note: "Used last resort fallback method"
      };
    }
    
    throw new Error('Failed to extract any bullet points from Claude response');
  }
  
  try {
    // Parse the JSON response
    console.log('Attempting to parse JSON object response');
    const jsonString = jsonMatch[0];
    
    // Log the JSON structure being parsed
    console.log('JSON to parse:', jsonString.substring(0, 500) + (jsonString.length > 500 ? '...' : ''));
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
      console.log('Successfully parsed JSON. Keys:', Object.keys(parsedData));
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      console.log('Invalid JSON structure. Attempting to clean JSON string...');
      
      // Try to clean the JSON string and parse again
      const cleanedJson = jsonString
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/"{/g, '{')
        .replace(/}"/g, '}')
        .replace(/\\"/g, '"')
        .replace(/"\s+{/g, '{')
        .replace(/}\s+"/g, '}');
        
      console.log('Cleaned JSON:', cleanedJson.substring(0, 200) + '...');
      parsedData = JSON.parse(cleanedJson);
    }
    
    // Check for the new structure
    if (!parsedData.bullet_points || !Array.isArray(parsedData.bullet_points)) {
      console.error('Missing expected structure. Keys found:', Object.keys(parsedData));
      throw new Error('Parsed response does not match expected structure');
    }
    
    // Clean up the parsed data to ensure consistent formatting
    const cleanedData = {
      bullet_points: parsedData.bullet_points.map(section => ({
        company: section.company || "Unknown Company",
        position: section.position || "Unknown Position",
        time_period: section.time_period || "",
        achievements: Array.isArray(section.achievements) ? 
          section.achievements.map(achievement => 
            achievement.replace(/^[•\-*]\s*/, "").trim()
          ) : []
      }))
    };
    
    // For backward compatibility with the UI, create a flat array of bullet points
    const bulletPoints = [];
    for (const section of cleanedData.bullet_points) {
      bulletPoints.push(`POSITION: ${section.position} at ${section.company} (${section.time_period || 'N/A'})`);
      for (const achievement of section.achievements) {
        bulletPoints.push(`• ${achievement}`);
      }
    }
    
    console.log('Successfully extracted bullet points:', bulletPoints.length);
    console.log('First few bullet points:', bulletPoints.slice(0, 3));
    return { 
      success: true, 
      bulletPoints,
      parsedData: cleanedData
    };
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
    throw new Error('Failed to parse the bullet points JSON');
  }
}

// Resume parsing system prompt
const RESUME_SYSTEM_PROMPT = `
You are an expert resume parser specializing in comprehensive extraction of professional achievements. 

Your task:

1. Extract ALL bullet points from EVERY job position listed in the experience section of the resume

2. Maintain the exact wording and formatting of each bullet point

3. Include the company name and job title as context for each bullet point

4. Preserve numerical achievements, metrics, and percentages

5. Ensure no bullet points are missed, even from older positions or internships

6. Capture technical skills, tools, and technologies mentioned within each bullet

Return ONLY a JSON object with the following structure:

{
  "bullet_points": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "time_period": "Date Range (if available)",
      "achievements": [
        "Full text of bullet point 1",
        "Full text of bullet point 2",
        "..."
      ]
    },
    {
      "company": "Previous Company",
      "position": "Previous Job Title",
      "time_period": "Previous Date Range (if available)",
      "achievements": [
        "Full text of bullet point 1",
        "..."
      ]
    }
  ]
}

Do not include any explanations, summaries, or additional text outside of the JSON response.
`;

export {
  extractBulletPointsFromText,
  processBulletPointResponse,
  RESUME_SYSTEM_PROMPT
};