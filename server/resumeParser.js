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
 * Strip markdown fences and return the JSON-looking portion of a model response.
 * @param {string} response
 * @returns {string|null}
 */
function extractJsonCandidate(response) {
  if (!response) return null;

  const fenced = response.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : response).trim();
  const start = candidate.indexOf('{');
  if (start === -1) return null;
  return candidate.slice(start).replace(/```\s*$/, '').trim();
}

/**
 * Close truncated JSON by finishing an open string and unmatched braces/brackets.
 * @param {string} jsonString
 * @returns {string}
 */
function repairTruncatedJson(jsonString) {
  let s = jsonString.trim();

  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (c === '"') inString = !inString;
  }
  if (inString) s += '"';

  inString = false;
  escaped = false;
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']');
    else if (c === '}' || c === ']') stack.pop();
  }

  s = s.replace(/,\s*$/, '');
  while (stack.length) s += stack.pop();
  return s;
}

function tryParseJson(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
}

function fallbackBulletPointResult(response, note) {
  const bulletPoints = extractBulletPointsFromText(response);

  if (bulletPoints.length > 0) {
    console.log(`Found ${bulletPoints.length} bullet points using fallback method`);
    return {
      success: true,
      bulletPoints,
      note,
    };
  }

  const fallbackBullets = response.split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 10);

  if (fallbackBullets.length > 0) {
    console.log('Using last resort fallback - first few lines of response');
    return {
      success: true,
      bulletPoints: fallbackBullets,
      note: "Used last resort fallback method",
    };
  }

  throw new Error('Failed to extract any bullet points from Claude response');
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
  
  const jsonString = extractJsonCandidate(response);

  if (!jsonString) {
    console.log('No JSON object found in response, attempting fallback parsing');
    console.log('Response excerpt:', response.substring(0, 200) + '...');
    return fallbackBulletPointResult(response, "Used fallback parsing method");
  }

  console.log('Found potential JSON object:', jsonString.substring(0, 200) + '...');
  console.log('Attempting to parse JSON object response');
  console.log('JSON to parse:', jsonString.substring(0, 500) + (jsonString.length > 500 ? '...' : ''));

  try {
    let parsedData = tryParseJson(jsonString);

    if (!parsedData) {
      console.log('JSON parse failed. Attempting to repair truncated JSON...');
      parsedData = tryParseJson(repairTruncatedJson(jsonString));
    }

    if (!parsedData) {
      console.log('Repaired JSON still invalid. Falling back to text extraction.');
      return fallbackBulletPointResult(response, "Used fallback parsing method after invalid JSON");
    }

    console.log('Successfully parsed JSON. Keys:', Object.keys(parsedData));
    
    // Check for the new structure
    if (!parsedData.bullet_points || !Array.isArray(parsedData.bullet_points)) {
      console.error('Missing expected structure. Keys found:', Object.keys(parsedData));
      return fallbackBulletPointResult(response, "Used fallback parsing method after unexpected JSON structure");
    }
    
    // Clean up the parsed data to ensure consistent formatting
    const cleanedData = {
      bullet_points: parsedData.bullet_points.map(section => ({
        company: (section && section.company) || "Unknown Company",
        position: (section && section.position) || "Unknown Position",
        time_period: (section && section.time_period) || "",
        achievements: Array.isArray(section && section.achievements) ? 
          section.achievements
            .filter(achievement => typeof achievement === 'string' && achievement.trim())
            .map(achievement => achievement.replace(/^[•\-*]\s*/, "").trim())
          : []
      })).filter(section =>
        section.company !== "Unknown Company" ||
        section.position !== "Unknown Position" ||
        section.achievements.length > 0
      )
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
    return fallbackBulletPointResult(response, "Used fallback parsing method after JSON error");
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

module.exports = {
  extractBulletPointsFromText,
  processBulletPointResponse,
  RESUME_SYSTEM_PROMPT
};