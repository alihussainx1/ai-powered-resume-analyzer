const STOP_WORDS = new Set([
  'the','and','for','with','that','this','from','you','your','our','are','will','have','has','had','into','but','not','all','any','can','who','what','when','where','how','why','their','they','them','a','an','to','of','in','on','at','by','as','or','is','be','we','it','if','than','then','also','using','use','used','work','working','role','job','team','teams','candidate','position','required','requirements','preferred','responsibilities','responsibility','experience','years','year','skills','skill'
]);

const COMMON_SKILLS = [
  'javascript','typescript','react','next.js','node.js','express','html','css','sass','tailwind','bootstrap',
  'python','java','c++','c#','php','sql','mysql','postgresql','mongodb','firebase','supabase','git','github',
  'rest api','graphql','docker','kubernetes','aws','azure','gcp','figma','ui/ux','redux','vite','webpack',
  'jest','cypress','playwright','testing','agile','scrum','communication','leadership','problem solving',
  'data analysis','machine learning','pandas','numpy','power bi','tableau','excel'
];

export function normalizeText(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function extractKeywords(jobDescription = '') {
  const normalized = normalizeText(jobDescription);
  const foundSkills = COMMON_SKILLS.filter((skill) => normalized.includes(skill));
  const words = normalized.split(' ').filter((word) => word.length > 3 && !STOP_WORDS.has(word));
  const frequency = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  const frequent = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([word]) => word);

  return [...new Set([...foundSkills, ...frequent])].slice(0, 24);
}

export function analyzeResume(resumeText = '', jobDescription = '') {
  const resume = normalizeText(resumeText);
  const keywords = extractKeywords(jobDescription);
  const matched = keywords.filter((keyword) => resume.includes(keyword));
  const missing = keywords.filter((keyword) => !resume.includes(keyword));
  const keywordScore = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;

  const checks = {
    contact: /@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText) && /(?:\+?\d[\d\s()-]{7,}\d)/.test(resumeText),
    summary: /(summary|profile|objective|about me)/i.test(resumeText),
    experience: /(experience|employment|work history|professional experience)/i.test(resumeText),
    education: /(education|academic|university|college|bachelor|master|phd)/i.test(resumeText),
    skills: /(skills|technical skills|core competencies|technologies)/i.test(resumeText),
    projects: /(projects|portfolio|github)/i.test(resumeText),
    metrics: /\b\d+%|\b\d+\+|\b\d{2,}\b/.test(resumeText),
    length: resumeText.trim().length > 500
  };

  const structureScore = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
  const score = jobDescription.trim()
    ? Math.round(keywordScore * 0.6 + structureScore * 0.4)
    : structureScore;

  const strengths = [];
  if (checks.contact) strengths.push('Contact information appears to be present.');
  if (checks.experience) strengths.push('The resume includes an experience section.');
  if (checks.education) strengths.push('Education information is included.');
  if (checks.skills) strengths.push('A dedicated skills section is present.');
  if (checks.projects) strengths.push('Projects or portfolio evidence is included.');
  if (checks.metrics) strengths.push('The resume includes measurable or numeric details.');
  if (keywordScore >= 70) strengths.push('Strong keyword alignment with the job description.');

  const improvements = [];
  if (!checks.summary) improvements.push('Add a concise professional summary tailored to the target role.');
  if (!checks.skills) improvements.push('Add a clearly labeled skills section with role-relevant technologies.');
  if (!checks.projects) improvements.push('Add relevant projects, portfolio work, or a GitHub link where appropriate.');
  if (!checks.metrics) improvements.push('Use measurable achievements, such as percentages, counts, time saved, revenue, or performance improvements.');
  if (!checks.contact) improvements.push('Make sure your email address and phone number are easy to find.');
  if (!checks.length) improvements.push('Add enough detail to show impact, responsibilities, projects, and achievements without unnecessary filler.');
  if (missing.length) improvements.push(`Consider naturally including relevant missing keywords: ${missing.slice(0, 8).join(', ')}.`);

  return {
    score,
    keywordScore,
    matched,
    missing,
    strengths: strengths.length ? strengths : ['The resume contains analyzable content.'],
    improvements: improvements.length ? improvements : ['Tailor wording and achievements more closely to the specific job description.'],
    checks
  };
}

export function buildChatReply(message, analysis) {
  const q = normalizeText(message);
  if (!q) return 'Ask me how to improve your resume, skills section, experience, summary, or keyword match.';

  if (q.includes('score')) {
    return `Your current resume score is ${analysis.score}/100, with a keyword match of ${analysis.keywordScore}%. Focus first on the missing keywords and the improvement suggestions shown in the analysis panel.`;
  }
  if (q.includes('keyword') || q.includes('ats')) {
    if (!analysis.missing.length) return 'Your keyword alignment is already strong. Keep the wording natural and make sure important skills also appear in context inside your experience or projects.';
    return `Your main missing keywords are: ${analysis.missing.slice(0, 8).join(', ')}. Add only the ones you genuinely know, and place them naturally in Skills, Experience, or Projects.`;
  }
  if (q.includes('experience') || q.includes('achievement')) {
    return 'Improve experience bullets with this formula: Action Verb + What You Built/Did + Tool or Skill + Measurable Result. Example: “Built 12 reusable React components, reducing duplicated UI code by 30%.”';
  }
  if (q.includes('summary') || q.includes('profile')) {
    return 'Write a 2–3 line summary that states your role, strongest skills, domain experience, and target value. Avoid generic claims such as “hard-working” unless supported by evidence.';
  }
  if (q.includes('skill')) {
    const missing = analysis.missing.slice(0, 6);
    return missing.length
      ? `Based on the job description, review these missing skills or keywords: ${missing.join(', ')}. Add only those you can honestly demonstrate.`
      : 'Your skills alignment looks solid. Prioritize the most relevant skills for the target job and support them with project or experience evidence.';
  }
  if (q.includes('project')) {
    return 'For each project, include the problem, your contribution, technologies used, and a measurable outcome. Add GitHub or live-demo links when available.';
  }
  if (q.includes('improve') || q.includes('better')) {
    return analysis.improvements.slice(0, 3).join(' ');
  }

  return `A good next step is to work on: ${analysis.improvements[0] || 'tailoring your resume to the target role and adding measurable achievements.'}`;
}
