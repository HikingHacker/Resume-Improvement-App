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
   * Get AI-powered comprehensive resume analysis
   * 
   * @param {Object} resumeData - Structured resume data with bullet points
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
  async analyzeResume(resumeData) {
    try {
      if (API_CONFIG.useMockData) {
        console.log("Using mock data for resume analysis");
        await delay(1500); // Simulate AI processing time
        
        // Generate mock analysis based on the resume data
        const mockAnalysis = generateMockAnalysis(resumeData);
        return mockAnalysis;
      }
      
      // Real API implementation:
      console.log("Sending resume data to analysis API...");
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/resume/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `API request failed with status ${response.status}`
        );
      }
      
      return await response.json();
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
  async getImprovementAnalytics(resumeData, improvements, savedBullets) {
    try {
      if (API_CONFIG.useMockData) {
        console.log("Using mock data for improvement analytics");
        await delay(2000); // Simulate AI processing time
        
        // Return mock analytics data
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
      
      // Real API implementation:
      console.log("Sending data to improvement analytics API...");
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/resume/improvement-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData, improvements, savedBullets }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `API request failed with status ${response.status}`
        );
      }
      
      return await response.json();
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

// Export the ResumeAPI and prompts
export { prompts };
export default ResumeAPI;