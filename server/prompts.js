/**
 * AI prompts used by the resume improvement server.
 * Keep this file as the source of truth — server.js should import from here
 * rather than inlining prompt strings.
 */

function normalizeJobDescriptions(jobDescriptionOrList) {
  if (Array.isArray(jobDescriptionOrList)) {
    return jobDescriptionOrList.map((item) => String(item || '').trim()).filter(Boolean);
  }
  const text = String(jobDescriptionOrList || '').trim();
  return text ? [text] : [];
}

function formatTargetContext(targetRole, jobDescriptions, maxJdLength = 8000) {
  const parts = [];
  const descriptions = normalizeJobDescriptions(jobDescriptions);

  if (targetRole && String(targetRole).trim()) {
    parts.push(`The candidate is targeting this role: ${String(targetRole).trim()}.`);
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

  if (resumeData.summary && String(resumeData.summary).trim()) {
    parts.push(`SUMMARY:\n${String(resumeData.summary).trim()}`);
  }

  const skills = Array.isArray(resumeData.skills)
    ? resumeData.skills.map((skill) => String(skill || '').trim()).filter(Boolean)
    : [];
  if (skills.length) {
    parts.push(`SKILLS LISTED ON THE RESUME:\n${skills.join(', ')}`);
  }

  const education = Array.isArray(resumeData.education) ? resumeData.education : [];
  if (education.length) {
    const lines = education.map((entry) => {
      const bits = [entry.degree, entry.school, entry.time_period].filter(Boolean);
      return `- ${bits.join(' · ') || 'Education entry'}`;
    });
    parts.push(`EDUCATION:\n${lines.join('\n')}`);
  }

  (resumeData.bullet_points || []).forEach((job, index) => {
    let heading = `POSITION ${index + 1}: ${job.position || 'Unknown Position'} at ${job.company || 'Unknown Company'}`;
    if (job.time_period) heading += ` (${job.time_period})`;
    const bullets = (job.achievements || []).map((bullet) => `• ${bullet}`).join('\n');
    parts.push(`${heading}\n\n${bullets || '• (no achievements listed)'}`);
  });

  return parts.join('\n\n');
}

function bulletIdFor(job, jobIndex, bulletIndex) {
  if (job && Array.isArray(job.achievementIds) && job.achievementIds[bulletIndex]) {
    return job.achievementIds[bulletIndex];
  }
  return `job${jobIndex}-bullet${bulletIndex}`;
}

const JSON_ONLY = 'Return only a valid JSON object. No markdown fences, no commentary, no extra keys.';

const METRIC_PLACEHOLDER_RULE = `
Metrics:
- Keep any number, percentage, dollar amount, headcount, or duration that already appears in the original text or in user-provided facts.
- When a result would be stronger with a quantity the user has not given, insert a bracket placeholder they can replace, such as [X%], [$Y], [N people], or [N months].
- Do not write a specific made-up figure such as "increased revenue 23%". Placeholders are how the user fills in real numbers later.
`.trim();

const RESUME_PARSER_SYSTEM_PROMPT = `
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
  "skills": ["Skill or tool 1", "Skill or tool 2"],
  "education": [
    { "school": "School name", "degree": "Degree or program", "time_period": "Date range or empty string" }
  ],
  "bullet_points": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "time_period": "Date Range (if available)",
      "achievements": [
        "Full original text of bullet 1",
        "Full original text of bullet 2"
      ]
    }
  ]
}
`.trim();

function getResumeParserPrompt(resumeText, { chunkIndex, chunkCount } = {}) {
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
}

const BULLET_IMPROVEMENT_SYSTEM_PROMPT = `
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

function getBulletImprovementPrompt(bulletPoint, additionalContext = '') {
  return `
Original bullet:
"${bulletPoint}"

${additionalContext ? `${additionalContext}` : 'No additional context provided.'}

Write three distinct improved versions of this bullet:
1. Outcome / impact emphasis
2. Methods / technical emphasis
3. Scope / collaboration emphasis

Keep the same meaning as the original. Use placeholders for any quantity the user has not supplied.
`.trim();
}

const BULLET_DETAILS_SYSTEM_PROMPT = `
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

function getBulletDetailsPrompt(bulletPoint, additionalContext = '') {
  return `
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
}

const SKILL_BULLET_SYSTEM_PROMPT = `
You are an expert resume writer helping a candidate add a truthful bullet that demonstrates a skill they confirmed using in a specific role.

Each option should:
1. Start with a strong action verb
2. Show impact in that role
3. Stay concise (about 220 characters)
4. Use the skill naturally rather than stuffing the skill name

${METRIC_PLACEHOLDER_RULE}

Do not invent employers, product names, or tools the user did not mention. The user will replace placeholders with real numbers.

${JSON_ONLY}

{
  "multipleSuggestions": ["option 1", "option 2", "option 3"],
  "reasoning": "How the three versions differ",
  "remainingWeaknesses": "What fact would make the bullet stronger",
  "followUpQuestions": ["Question that would replace a placeholder or add a missing fact"]
}
`.trim();

function getSkillBulletPrompt(skillName, skillRecommendation, jobDetails = {}, selectedKeywords = []) {
  const keywords = Array.isArray(selectedKeywords) && selectedKeywords.length
    ? `Incorporate these terms only if they fit this role: ${selectedKeywords.join(', ')}.`
    : '';

  return `
Write 3 resume bullet options that show the skill "${skillName}" in this role:
Position: ${jobDetails.position || 'Unknown position'}
Company: ${jobDetails.company || 'Unknown company'}
Time period: ${jobDetails.time_period || 'Not specified'}

Why this skill was suggested: ${skillRecommendation || 'Not specified'}

The candidate confirmed they used this skill in this role. Keep the bullets plausible for that role. Use placeholders such as [X%], [$Y], or [N people] wherever a quantity would help and no number was provided.
${keywords}
`.trim();
}

const RESUME_ANALYSIS_SYSTEM_PROMPT = `
You are an expert resume reviewer. Diagnose this resume against the candidate's target if one is provided; otherwise infer a likely target from the most recent roles.

Field meanings (do not repeat the same idea across fields):
- strengths: 3-5 evidence-backed strengths, citing a role or bullet
- weaknesses: 3-5 gaps versus the target (structure, metrics, scope, missing proof)
- areasForImprovement: 3-5 concrete rewrite actions, not restated weaknesses
- missingSkills: 3-5 skills implied by the target that are not evidenced on the resume. Skip anything already in the skills list or bullets. Only suggest skills a person in these roles could reasonably have used.
- recommendedRoles: 3-5 titles that match seniority and domain
- topIndustries: 3-6 industries with match High/Medium/Low and keySkills
- companies.major / companies.promising: up to 5 each, plausible given seniority and domain. If location is unknown, choose widely hiring firms and say so in the name string only if needed.
- atsKeywords: 5-12 keywords already present and 8-15 high-value keywords from the target postings that are missing. Each item is {keyword, present, priority}.

Ground ATS keywords and missing skills in the target role and job descriptions when they are provided. Do not treat the experience bullets as a complete resume if a skills list or summary is also present.

${JSON_ONLY}

{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "areasForImprovement": ["..."],
  "missingSkills": ["..."],
  "recommendedRoles": ["..."],
  "topIndustries": [
    {"name": "industry", "match": "High", "keySkills": ["skill"]}
  ],
  "companies": {
    "major": ["..."],
    "promising": ["..."]
  },
  "atsKeywords": [
    {"keyword": "keyword", "present": true, "priority": "High"}
  ]
}
`.trim();

function getResumeAnalysisPrompt(resumeData, { targetRole = '', jobDescriptions } = {}) {
  const target = formatTargetContext(targetRole, jobDescriptions);
  return `
Analyze this resume.

${target ? `TARGET\n${target}\n` : 'No target role or job descriptions were provided. Infer a likely target from recent roles.\n'}

RESUME
${formatResumeForAnalysis(resumeData)}
`.trim();
}

const ANALYTICS_SYSTEM_PROMPT = `
You are an expert resume coach reviewing work already done on this resume.

Look at the original resume, the saved rewrites, and the target if provided. Then recommend what to do next.

- generalImprovements: 4-7 patterns the candidate should apply to remaining bullets
- missingConcepts: 3-5 categories, each with 2-4 skills the resume still does not evidence. Choose categories that fit this person and target; do not force unrelated themes. Each skill needs a name and a recommendation that tells them how to show it if it is true.
- aiInsights: 3-5 strategic notes (positioning, seniority, target fit)

Do not suggest skills already demonstrated in original or improved bullets. Prefer skills that overlap the target postings.

${JSON_ONLY}

{
  "generalImprovements": ["..."],
  "missingConcepts": [
    {
      "category": "Category name",
      "skills": [
        { "name": "Skill name", "recommendation": "How to show this if it is true of their work" }
      ]
    }
  ],
  "aiInsights": ["..."]
}
`.trim();

function getImprovementAnalyticsPrompt(resumeData, improvements = {}, savedBullets = {}, { targetRole = '', jobDescriptions } = {}) {
  const target = formatTargetContext(targetRole, jobDescriptions);
  let formattedResume = '';
  let formattedImprovements = '';

  (resumeData?.bullet_points || []).forEach((job, jobIndex) => {
    formattedResume += `POSITION: ${job.position || 'Unknown Position'} at ${job.company || 'Unknown Company'}`;
    if (job.time_period) formattedResume += ` (${job.time_period})`;
    formattedResume += '\n\n';

    (job.achievements || []).forEach((bullet, bulletIndex) => {
      const id = bulletIdFor(job, jobIndex, bulletIndex);
      formattedResume += `• ${bullet}\n`;
      const improvement = improvements && improvements[id];
      if (savedBullets && savedBullets[id] && improvement && improvement.improvedBulletPoint) {
        formattedImprovements += `ORIGINAL: ${bullet}\nIMPROVED: ${improvement.improvedBulletPoint}\n\n`;
      }
    });
    formattedResume += '\n';
  });

  return `
Analyze this resume and the bullet rewrites the candidate already saved.

${target ? `TARGET\n${target}\n` : 'No target role or job descriptions were provided.\n'}

ORIGINAL RESUME:
${formattedResume}

SAVED REWRITES:
${formattedImprovements || '(none saved yet)'}
`.trim();
}

module.exports = {
  formatTargetContext,
  formatResumeForAnalysis,
  RESUME_PARSER_SYSTEM_PROMPT,
  getResumeParserPrompt,
  BULLET_IMPROVEMENT_SYSTEM_PROMPT,
  getBulletImprovementPrompt,
  BULLET_DETAILS_SYSTEM_PROMPT,
  getBulletDetailsPrompt,
  SKILL_BULLET_SYSTEM_PROMPT,
  getSkillBulletPrompt,
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  getResumeAnalysisPrompt,
  ANALYTICS_SYSTEM_PROMPT,
  getImprovementAnalyticsPrompt,
};
