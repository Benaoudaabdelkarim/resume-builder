import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const APPLICATIONS_DIR = path.join(ROOT_DIR, 'applications');
const PROFILE_FILE = path.join(ROOT_DIR, 'profile.md');
const CONFIG_FILE = path.join(ROOT_DIR, '.env');

// Ensure applications directory exists
if (!fs.existsSync(APPLICATIONS_DIR)) {
  fs.mkdirSync(APPLICATIONS_DIR, { recursive: true });
}

/**
 * Sanitize strings for safe folder naming.
 */
function sanitizeName(str) {
  return (str || 'Unknown')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
}

/**
 * Convert structured resume JSON into clean ATS Markdown format.
 */
export function resumeJsonToMarkdown(resume) {
  if (!resume) return '';
  const { personalInfo = {}, summary = '', skills = [], experience = [], education = [], projects = [] } = resume;

  let md = `# ${personalInfo.fullName || 'Candidate'}\n`;
  if (personalInfo.headline) {
    md += `**${personalInfo.headline}**\n\n`;
  }

  const contacts = [
    personalInfo.location,
    personalInfo.phone,
    personalInfo.email,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);

  if (contacts.length > 0) {
    md += `${contacts.join('\n')}\n\n`;
  }

  if (summary) {
    md += `## Professional Summary\n\n${summary}\n\n`;
  }

  if (skills && skills.length > 0) {
    md += `## Technical Skills & Competencies\n\n`;
    for (const group of skills) {
      const items = Array.isArray(group.items) ? group.items.join(', ') : group.items;
      const cat = (group.category || 'Skills').replace(/:\s*$/, '');
      md += `**${cat}**\n${items}\n\n`;
    }
  }

  if (experience && experience.length > 0) {
    md += `## Professional Experience\n\n`;
    for (const exp of experience) {
      md += `### ${exp.role}\n`;
      if (exp.company) md += `${exp.company}\n`;
      const meta = [exp.period, exp.location].filter(Boolean).join(' | ');
      if (meta) md += `*${meta}*\n`;
      if (Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          md += `* ${b}\n`;
        }
      }
      md += `\n`;
    }
  }

  if (education && education.length > 0) {
    md += `## Education\n\n`;
    for (const edu of education) {
      md += `### ${edu.degree}\n`;
      if (edu.school) md += `${edu.school}\n`;
      const meta = [edu.period, edu.location].filter(Boolean).join(' | ');
      if (meta) md += `*${meta}*\n`;
      if (edu.details) md += `* ${edu.details}\n`;
      md += `\n`;
    }
  }

  if (projects && projects.length > 0) {
    md += `## Key Projects\n\n`;
    for (const proj of projects) {
      md += `### ${proj.name}${proj.technologies ? ` — ${proj.technologies}` : ''}\n`;
      if (proj.link) md += `*Link: ${proj.link}*\n`;
      if (Array.isArray(proj.bullets)) {
        for (const b of proj.bullets) {
          md += `* ${b}\n`;
        }
      }
      md += `\n`;
    }
  }

  return md;
}

/**
 * Convert cover letter JSON/object to clean readable text.
 */
export function coverLetterToText(cl) {
  if (!cl) return '';
  if (typeof cl === 'string') return cl;

  let text = '';
  if (cl.date) text += `${cl.date}\n\n`;
  if (cl.recipient) text += `${cl.recipient}\n`;
  if (cl.company) text += `${cl.company}\n\n`;
  if (cl.greeting) text += `${cl.greeting}\n\n`;

  if (Array.isArray(cl.bodyParagraphs)) {
    text += cl.bodyParagraphs.join('\n\n') + '\n\n';
  } else if (cl.body) {
    text += `${cl.body}\n\n`;
  }

  if (cl.signOff) text += `${cl.signOff}\n`;
  if (cl.senderName) text += `${cl.senderName}\n`;

  return text;
}

/**
 * Save complete application bundle.
 */
export async function saveApplicationBundle({
  companyName = 'UnknownCompany',
  roleTitle = 'Role',
  jobPost = '',
  jobUrl = '',
  notes = '',
  resumeData,
  resumeMarkdown = '',
  coverLetterData,
  coverLetterText = '',
  templateId = 'modern',
  resumePdfBase64 = null,
  resumeDocxBase64 = null,
  coverLetterPdfBase64 = null,
}) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  const folderName = `${dateStr}_${sanitizeName(companyName)}_${sanitizeName(roleTitle)}_${timeStr}`;
  const targetDir = path.join(APPLICATIONS_DIR, folderName);

  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Save Job Post & Job URL
  let fullJobPost = jobPost || '';
  if (jobUrl) {
    fullJobPost = `Source Link: ${jobUrl}\n====================================\n\n${fullJobPost}`;
    fs.writeFileSync(path.join(targetDir, 'job_url.txt'), jobUrl, 'utf-8');
  }
  fs.writeFileSync(path.join(targetDir, 'job_post.txt'), fullJobPost, 'utf-8');

  // 2. Save Notes
  fs.writeFileSync(path.join(targetDir, 'notes.txt'), notes || '', 'utf-8');

  // 3. Save Resume JSON & Markdown
  const finalResumeMd = resumeMarkdown || resumeJsonToMarkdown(resumeData);
  fs.writeFileSync(path.join(targetDir, 'resume.json'), JSON.stringify(resumeData || {}, null, 2), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'resume.md'), finalResumeMd, 'utf-8');

  // 4. Save Cover Letter TXT & JSON
  const finalCoverText = coverLetterText || coverLetterToText(coverLetterData);
  fs.writeFileSync(path.join(targetDir, 'cover_letter.json'), JSON.stringify(coverLetterData || {}, null, 2), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'cover_letter.txt'), finalCoverText, 'utf-8');

  // 5. Save PDFs and DOCX if provided
  if (resumePdfBase64) {
    const resumeBuf = Buffer.from(resumePdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    fs.writeFileSync(path.join(targetDir, 'resume.pdf'), resumeBuf);
  }

  if (resumeDocxBase64) {
    const docxBuf = Buffer.from(resumeDocxBase64.replace(/^data:application\/[a-zA-Z0-9.-]+;base64,/, ''), 'base64');
    fs.writeFileSync(path.join(targetDir, 'resume.docx'), docxBuf);
  }

  if (coverLetterPdfBase64) {
    const coverBuf = Buffer.from(coverLetterPdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    fs.writeFileSync(path.join(targetDir, 'cover_letter.pdf'), coverBuf);
  }

  // 6. Save Bundle Metadata for fast browsing
  const metadata = {
    folderName,
    createdAt: new Date().toISOString(),
    companyName,
    roleTitle,
    jobUrl: jobUrl || null,
    templateId,
    hasResumePdf: Boolean(resumePdfBase64),
    hasResumeDocx: Boolean(resumeDocxBase64),
    hasCoverLetterPdf: Boolean(coverLetterPdfBase64),
  };
  fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

  return { success: true, folderName, targetDir, metadata };
}

/**
 * List all saved applications.
 */
export function listApplications() {
  if (!fs.existsSync(APPLICATIONS_DIR)) return [];
  const entries = fs.readdirSync(APPLICATIONS_DIR, { withFileTypes: true });

  const list = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirPath = path.join(APPLICATIONS_DIR, entry.name);
      const metaPath = path.join(dirPath, 'metadata.json');

      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          list.push(meta);
        } catch {
          list.push({ folderName: entry.name });
        }
      } else {
        list.push({ folderName: entry.name });
      }
    }
  }

  // Sort newest first
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Get all files from a specific saved application.
 */
export function getApplication(folderName) {
  const safeFolder = path.basename(folderName);
  const targetDir = path.join(APPLICATIONS_DIR, safeFolder);
  if (!fs.existsSync(targetDir)) return null;

  const readSafe = (file) => {
    const p = path.join(targetDir, file);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
  };

  let resumeData = null;
  let coverLetterData = null;
  let metadata = null;

  try { resumeData = JSON.parse(readSafe('resume.json') || '{}'); } catch {}
  try { coverLetterData = JSON.parse(readSafe('cover_letter.json') || '{}'); } catch {}
  try { metadata = JSON.parse(readSafe('metadata.json') || '{}'); } catch {}

  return {
    folderName: safeFolder,
    metadata,
    jobPost: readSafe('job_post.txt') || '',
    jobUrl: readSafe('job_url.txt') || metadata?.jobUrl || '',
    notes: readSafe('notes.txt') || '',
    resumeData,
    resumeMarkdown: readSafe('resume.md') || '',
    coverLetterData,
    coverLetterText: readSafe('cover_letter.txt') || '',
    hasResumePdf: fs.existsSync(path.join(targetDir, 'resume.pdf')),
    hasCoverLetterPdf: fs.existsSync(path.join(targetDir, 'cover_letter.pdf')),
    fullPath: targetDir,
  };
}

/**
 * Read base profile.md
 */
export function getProfile() {
  if (fs.existsSync(PROFILE_FILE)) {
    return fs.readFileSync(PROFILE_FILE, 'utf-8');
  }
  return '';
}

/**
 * Save updated base profile.md
 */
export function saveProfile(content) {
  fs.writeFileSync(PROFILE_FILE, content, 'utf-8');
  return true;
}

/**
 * Get or save API key from/to .env
 */
export function getStoredApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (fs.existsSync(CONFIG_FILE)) {
    const envContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

export function saveApiKeyToEnv(key) {
  let content = '';
  if (fs.existsSync(CONFIG_FILE)) {
    content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    if (content.includes('GEMINI_API_KEY=')) {
      content = content.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${key.trim()}`);
    } else {
      content += `\nGEMINI_API_KEY=${key.trim()}\n`;
    }
  } else {
    content = `GEMINI_API_KEY=${key.trim()}\n`;
  }
  fs.writeFileSync(CONFIG_FILE, content.trim() + '\n', 'utf-8');
  process.env.GEMINI_API_KEY = key.trim();
  return true;
}
