/**
 * Clean helper to strip rogue bolding or citation tags
 */
const cleanText = (str) => {
  if (!str) return '';
  return str.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[cite:\s*\d+\]/gi, '').trim();
};

/**
 * Convert structured resume JSON into clean ATS-compatible Markdown format.
 */
export function resumeJsonToMarkdown(resume) {
  if (!resume) return '';
  const {
    personalInfo = {},
    summary = '',
    skills = [],
    experience = [],
    education = [],
    projects = [],
  } = resume;

  let md = `# ${cleanText(personalInfo.fullName) || 'Candidate'}\n`;
  if (personalInfo.headline) {
    md += `**${cleanText(personalInfo.headline)}**\n\n`;
  }

  const rawContacts = [
    cleanText(personalInfo.location),
    cleanText(personalInfo.phone),
    cleanText(personalInfo.email),
    cleanText(personalInfo.portfolio),
    cleanText(personalInfo.linkedin),
    cleanText(personalInfo.github),
  ].filter(Boolean);

  const seen = new Set();
  const contacts = [];
  for (const c of rawContacts) {
    const norm = c.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      contacts.push(c);
    }
  }

  if (contacts.length > 0) {
    md += `${contacts.join('\n')}\n\n`;
  }

  if (summary) {
    md += `## Professional Summary\n\n${cleanText(summary)}\n\n`;
  }

  if (skills && skills.length > 0) {
    md += `## Technical Skills & Competencies\n\n`;
    for (const group of skills) {
      const items = Array.isArray(group.items) ? group.items.join(', ') : group.items;
      const cat = (group.category || 'Skills').replace(/:\s*$/, '');
      md += `**${cleanText(cat)}**\n${cleanText(items)}\n\n`;
    }
  }

  if (experience && experience.length > 0) {
    md += `## Professional Experience\n\n`;
    for (const exp of experience) {
      md += `### ${cleanText(exp.role)}\n`;
      if (exp.company) md += `${cleanText(exp.company)}\n`;
      const meta = [cleanText(exp.period), cleanText(exp.location)].filter(Boolean).join(' | ');
      if (meta) md += `*${meta}*\n`;
      if (Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          md += `* ${cleanText(b)}\n`;
        }
      }
      md += `\n`;
    }
  }

  if (education && education.length > 0) {
    md += `## Education\n\n`;
    for (const edu of education) {
      md += `### ${cleanText(edu.degree)}\n`;
      if (edu.school) md += `${cleanText(edu.school)}\n`;
      const meta = [cleanText(edu.period), cleanText(edu.location)].filter(Boolean).join(' | ');
      if (meta) md += `*${meta}*\n`;
      if (edu.details) md += `* ${cleanText(edu.details)}\n`;
      md += `\n`;
    }
  }

  if (projects && projects.length > 0) {
    md += `## Key Projects\n\n`;
    for (const proj of projects) {
      md += `### ${cleanText(proj.name)}${proj.technologies ? ` — ${cleanText(proj.technologies)}` : ''}\n`;
      if (Array.isArray(proj.bullets)) {
        for (const b of proj.bullets) {
          md += `* ${cleanText(b)}\n`;
        }
      }
      md += `\n`;
    }
  }

  return md;
}
