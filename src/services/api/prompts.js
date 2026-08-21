/**
 * AI Prompts for Resume Improvement Tool
 *
 * Keep these aligned with server/prompts.js. The server is the live source of
 * truth; this file is used by the client Claude path and by skill-bullet helpers.
 */

function formatTargetContext(targetRole, jobDescriptions, maxJdLength = 8000) {
  const parts = [];
  const descriptions = Array.isArray(jobDescriptions)
    ? jobDescriptions.map((item) => String(item || '').trim()).filter(Boolean)
    : (String(jobDescriptions || '').trim() ? [String(jobDescriptions).trim()] : []);

  if (targetRole?.trim()) {
    parts.push(`The candidate is targeting this role: ${targetRole.trim()}.`);
    parts.push('Prefer overlapping skills and language from the postings below when they are true of the candidate.');
  }

  if (descriptions.length === 1) {
    parts.push(`Job description:\n${descriptions[0].slice(0, maxJdLength)}`);
  } else if (descriptions.length > 1) {
    parts.push(
      `The candidate collected ${descriptions.length} job descriptions. Prefer skills, keywords, and phrasing that overlap across postings when they are true of the candidate.`
    );
    const perJd = Math.max(600, Math.floor(maxJdLength / descriptions.length));
    descriptions.forEach((text, index) => {
      parts.push(`Job description ${index + 1}:\n${text.slice(0, perJd)}`);
    });
  }

  return parts.join('\n');
}

function formatResumeForAnalysis(resumeData) {
  if (!resumeData) return '';
  const parts = [];

  if (resumeData.summary?.trim()) {
    parts.push(`SUMMARY:\n${resumeData.summary.trim()}`);
  }

  const skills = Array.isArray(resumeData.skills)
    ? resumeData.skills.map((skill) => String(skill || '').trim()).filter(Boolean)
    : [];
  if (skills.length) {
    parts.push(`SKILLS LISTED ON THE RESUME:\n${skills.join(', ')}`);
  }

  (resumeData.bullet_points || []).forEach((job, index) => {
    let heading = `POSITION ${index + 1}: ${job.position || 'Unknown Position'} at ${job.company || 'Unknown Company'}`;
    if (job.time_period) heading += ` (${job.time_period})`;
    const bullets = (job.achievements || []).map((bullet) => `• ${bullet}`).join('\n');
    parts.push(`${heading}\n\n${bullets || '• (no achievements listed)'}`);
  });

  return parts.join('\n\n');
}

const JSON_ONLY = 'Return only a valid JSON object. No markdown fences, no commentary, no extra keys.';

const METRIC_PLACEHOLDER_RULE = `
Metrics:
- Keep any number, percentage, dollar amount, headcount, or duration that already appears in the original text or in user-provided facts.
- When a result would be stronger with a quantity the user has not given, insert a bracket placeholder they can replace, such as [X%], [$Y], [N people], or [N months].
- Do not write a specific made-up figure such as "increased revenue 23%". Placeholders are how the user fills in real numbers later.
`.trim();

export const BULLET_IMPROVEMENT_SYSTEM_PROMPT = `
You are an expert resume writer helping a candidate rewrite one bullet.

Improve the bullet by:
1. Using a stronger, specific action verb
2. Leading with impact or outcome when the original supports it
3. Naming tools and technologies that already appear in the original or in user-provided facts
4. Staying concise (about 220 characters, one line)
5. Mirroring language from the target role and overlapping job-description keywords when those are provided and true of the original work

${METRIC_PLACEHOLDER_RULE}

Do not add employers, products, tools, teams, or claims that are not in the original bullet or user-provided facts.

${JSON_ONLY}

{
  "multipleSuggestions": ["rewrite emphasizing outcomes", "rewrite emphasizing methods or tools", "rewrite emphasizing scope or collaboration"],
  "reasoning": "How the three versions differ",
  "remainingWeaknesses": "One or two specific gaps the user could still fill",
  "followUpQuestions": ["Question that would let the user replace a placeholder or add a missing fact"]
}
`.trim();

export const getBulletImprovementPrompt = (bulletPoint, additionalContext = '') => `
Original bullet:
"${bulletPoint}"

${additionalContext ? `${additionalContext}` : 'No additional context provided.'}

Write three distinct improved versions of this bullet:
1. Outcome / impact emphasis
2. Methods / technical emphasis
3. Scope / collaboration emphasis

Keep the same meaning as the original. Use placeholders for any quantity the user has not supplied.
`.trim();

export const BULLET_DETAILS_SYSTEM_PROMPT = `
You are an expert resume coach. Ask short, specific questions that would let the candidate add missing facts before a rewrite.

Ask about real quantities, scope, tools, outcomes, and constraints that are not already in the original bullet or user-provided facts.
Do not rewrite the bullet.
Do not invent facts.

${JSON_ONLY}

{
  "followUpQuestions": ["Specific question the candidate can answer in a few words"],
  "remainingWeaknesses": "One sentence on what is missing from the original bullet"
}
`.trim();

export const getBulletDetailsPrompt = (bulletPoint, additionalContext = '') => `
Original bullet:
"${bulletPoint}"

${additionalContext ? `${additionalContext}` : 'No additional context provided.'}

Write 3 to 4 questions that would make a rewrite stronger. Prefer questions about:
- a metric, dollar amount, percentage, or time saved
- scale (people, teams, customers, systems)
- tools or methods actually used
- the outcome or decision that followed

Skip anything already answered in the original bullet or user-provided facts.
`.trim();

export const RESUME_PARSER_SYSTEM_PROMPT = `
You are an expert resume parser. Extract professional content without rewriting it.

Rules:
- Extract every work-experience role, including internships and older positions.
- Copy achievement bullets verbatim. Do not paraphrase, strengthen, or shorten them.
- Put company and job title only in the company and position fields, not inside achievement strings.
- Keep numbers, metrics, tools, and technologies exactly as written.
- Also capture a short professional summary if present, a skills list if present, and education entries if present.
- If a field is missing, use "" or [].

${JSON_ONLY}

{
  "summary": "Professional summary text or empty string",
  "skills": ["Skill or tool 1"],
  "education": [
    { "school": "School name", "degree": "Degree or program", "time_period": "Date range or empty string" }
  ],
  "bullet_points": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "time_period": "Date Range (if available)",
      "achievements": ["Full original text of bullet 1"]
    }
  ]
}
`.trim();

export const getResumeParserPrompt = (resumeText, { chunkIndex, chunkCount } = {}) => {
  if (chunkCount > 1) {
    return `
PARTIAL RESUME (section ${chunkIndex + 1} of ${chunkCount}).
Extract every job, skill, education entry, and achievement that appears in THIS section only.
If this section has no experience entries, return {"summary":"","skills":[],"education":[],"bullet_points":[]}.
Do not invent roles, skills, or bullets to fill gaps.

${resumeText}
`.trim();
  }

  return `
Extract the professional content from this resume. Preserve exact achievement wording.

${resumeText}
`.trim();
};

export const RESUME_ANALYSIS_SYSTEM_PROMPT = `
You are an expert resume reviewer. Diagnose this resume against the candidate's target if one is provided; otherwise infer a likely target from the most recent roles.

Field meanings (do not repeat the same idea across fields):
- strengths: 3-5 evidence-backed strengths, citing a role or bullet
- weaknesses: 3-5 gaps versus the target
- areasForImprovement: 3-5 concrete rewrite actions, not restated weaknesses
- missingSkills: 3-5 skills implied by the target that are not evidenced on the resume
- recommendedRoles: 3-5 titles that match seniority and domain
- topIndustries: 3-6 industries with match High/Medium/Low and keySkills
- companies.major / companies.promising: up to 5 each
- atsKeywords: keywords from the target postings, each {keyword, present, priority}

${JSON_ONLY}
`.trim();

export const getResumeAnalysisPrompt = (resumeData, { targetRole = '', jobDescriptions } = {}) => {
  const target = formatTargetContext(targetRole, jobDescriptions);
  return `
Analyze this resume.

${target ? `TARGET\n${target}\n` : 'No target role or job descriptions were provided. Infer a likely target from recent roles.\n'}

RESUME
${formatResumeForAnalysis(resumeData)}
`.trim();
};

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
`.trim();

export const SKILL_BULLET_SYSTEM_PROMPT = `
You are an expert resume writer helping a candidate add a truthful bullet that demonstrates a skill they confirmed using in a specific role.

Each option should:
1. Start with a strong action verb
2. Show impact in that role
3. Stay concise (about 220 characters)
4. Use the skill naturally rather than stuffing the skill name

${METRIC_PLACEHOLDER_RULE}

Do not invent employers, product names, or tools the user did not mention. The user will replace placeholders with real numbers.

${JSON_ONLY}
`.trim();

export const getSkillBulletPrompt = (skillName, skillRecommendation, jobDetails, selectedKeywords = []) => {
  const keywordsContext = selectedKeywords.length > 0
    ? `Incorporate these terms only if they fit this role: ${selectedKeywords.join(', ')}.`
    : '';

  return `
Write 3 resume bullet options that show the skill "${skillName}" in this role:
Position: ${jobDetails.position}
Company: ${jobDetails.company}
Time Period: ${jobDetails.time_period || 'Current'}

Why this skill was suggested: ${skillRecommendation}

The candidate confirmed they used this skill in this role. Keep the bullets plausible for that role. Use placeholders such as [X%], [$Y], or [N people] wherever a quantity would help and no number was provided.

${keywordsContext}
`.trim();
};

export const getImprovementAnalyticsPrompt = (resumeData, improvements, savedBullets, { targetRole = '', jobDescriptions } = {}) => {
  const target = formatTargetContext(targetRole, jobDescriptions);
  const formattedBullets = (resumeData?.bullet_points || []).flatMap((job, jobIndex) => {
    return (job.achievements || []).map((bullet, bulletIndex) => {
      const bulletId = job.achievementIds?.[bulletIndex] || `job${jobIndex}-bullet${bulletIndex}`;
      if (!savedBullets?.[bulletId]) return null;
      const improvement = improvements?.[bulletId];
      if (!improvement?.improvedBulletPoint) return null;
      return `
      Position: ${job.position}
      Company: ${job.company}
      Original: ${bullet}
      Improved: ${improvement.improvedBulletPoint}
    `;
    });
  }).filter(Boolean).join('\n\n');

  return `
Analyze these resume bullet point improvements.

${target ? `TARGET\n${target}\n` : ''}

${formattedBullets || '(none saved yet)'}

Based on these improvements, provide:
1. General Improvement Strategies: What patterns of improvement do you see?
2. Missing Concepts: What skills or concepts are still missing that would strengthen the resume?
3. AI Insights: What further recommendations do you have for this resume?

Format your response as a JSON object with generalImprovements, missingConcepts, and aiInsights.
`.trim();
};

export default {
  BULLET_IMPROVEMENT_SYSTEM_PROMPT,
  getBulletImprovementPrompt,
  RESUME_PARSER_SYSTEM_PROMPT,
  getResumeParserPrompt,
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  getResumeAnalysisPrompt,
  getRelatedKeywordsPrompt,
  SKILL_BULLET_SYSTEM_PROMPT,
  getSkillBulletPrompt,
  getImprovementAnalyticsPrompt,
};
