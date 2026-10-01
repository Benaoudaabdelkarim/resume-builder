import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractSalaryInfo } from './salaryExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const APPLICATIONS_DIR = path.join(ROOT_DIR, 'applications');
const PROFILE_FILE = path.join(ROOT_DIR, 'profile.md');
const CONFIG_FILE = path.join(ROOT_DIR, '.env');

// Ensure base directories exist
if (!fs.existsSync(APPLICATIONS_DIR)) {
  fs.mkdirSync(APPLICATIONS_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

/**
 * Get user storage root directory.
 */
export function getUserDir(userId) {
  if (!userId) return ROOT_DIR;
  const dir = path.join(USERS_DIR, String(userId));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get user applications directory.
 */
export function getUserApplicationsDir(userId) {
  if (!userId) return APPLICATIONS_DIR;
  const dir = path.join(getUserDir(userId), 'applications');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get user profile path.
 */
export function getUserProfilePath(userId) {
  if (!userId) return PROFILE_FILE;
  return path.join(getUserDir(userId), 'profile.md');
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

  const rawContacts = [
    personalInfo.location,
    personalInfo.phone,
    personalInfo.email,
    personalInfo.portfolio,
    personalInfo.linkedin,
    personalInfo.github,
  ].filter(Boolean);

  const seen = new Set();
  const contacts = [];
  for (const c of rawContacts) {
    const norm = String(c).replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      contacts.push(c);
    }
  }

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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const effectiveDate = (!cl.date || cl.date.includes('e.g.') || cl.date.toLowerCase().includes('current date'))
    ? todayFormatted
    : cl.date;

  let text = '';
  text += `${effectiveDate}\n\n`;
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
export async function saveApplicationBundle(bundleData = {}, userId = null) {
  const {
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
    minRate: inputMinRate = null,
    maxRate: inputMaxRate = null,
    rateType: inputRateType = null,
  } = bundleData;
  const appsDir = getUserApplicationsDir(userId);
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  const folderName = `${dateStr}_${sanitizeName(companyName)}_${sanitizeName(roleTitle)}_${timeStr}`;
  const targetDir = path.join(appsDir, folderName);

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
  if (coverLetterData && typeof coverLetterData === 'object') {
    if (!coverLetterData.date || coverLetterData.date.includes('e.g.') || coverLetterData.date.toLowerCase().includes('current date')) {
      coverLetterData.date = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
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

  // 6. Extract / Save Salary Rates in Metadata
  let minRate = inputMinRate;
  let maxRate = inputMaxRate;
  let rateType = inputRateType;

  if ((minRate === null || minRate === undefined || minRate === '') && (maxRate === null || maxRate === undefined || maxRate === '')) {
    const extracted = extractSalaryInfo(jobPost);
    minRate = extracted.minRate;
    maxRate = extracted.maxRate;
    rateType = extracted.rateType;
  }

  // Save Bundle Metadata for fast browsing
  const metadata = {
    folderName,
    createdAt: new Date().toISOString(),
    companyName,
    roleTitle,
    minRate,
    maxRate,
    rateType,
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
 * List all saved applications for a user (including root applications directory and local user stores).
 */
export function listApplications(userId = null) {
  const dirs = [];
  if (userId) {
    dirs.push(getUserApplicationsDir(userId));
  }
  if (fs.existsSync(USERS_DIR)) {
    try {
      const userFolders = fs.readdirSync(USERS_DIR);
      for (const u of userFolders) {
        const uAppDir = path.join(USERS_DIR, u, 'applications');
        if (fs.existsSync(uAppDir) && !dirs.includes(uAppDir)) {
          dirs.push(uAppDir);
        }
      }
    } catch {}
  }
  dirs.push(APPLICATIONS_DIR);

  const seenFolders = new Set();
  const list = [];

  for (const appsDir of dirs) {
    if (!fs.existsSync(appsDir)) continue;
    const entries = fs.readdirSync(appsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !seenFolders.has(entry.name)) {
        const dirPath = path.join(appsDir, entry.name);
        try {
          const files = fs.readdirSync(dirPath);
          if (files.length === 0) continue; // Skip empty directories
        } catch {
          continue;
        }

        seenFolders.add(entry.name);
        const metaPath = path.join(dirPath, 'metadata.json');

        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            if (!meta.folderName) meta.folderName = entry.name;
            // Backfill salary info if missing in older metadata
            if (meta.minRate === undefined && meta.maxRate === undefined) {
              const jobPostFile = path.join(dirPath, 'job_post.txt');
              if (fs.existsSync(jobPostFile)) {
                const text = fs.readFileSync(jobPostFile, 'utf-8');
                const sal = extractSalaryInfo(text);
                meta.minRate = sal.minRate;
                meta.maxRate = sal.maxRate;
                meta.rateType = sal.rateType;
              }
            }
            list.push(meta);
          } catch {
            list.push({ folderName: entry.name });
          }
        } else {
          // Reconstruct basic metadata from folder name
          const parts = entry.name.split('_');
          const datePart = parts[0] || '';
          list.push({
            folderName: entry.name,
            companyName: parts[1] ? parts[1].replace(/-/g, ' ') : 'Company',
            roleTitle: parts.slice(2, -1).join(' ') || 'Role',
            createdAt: datePart,
            hasResumePdf: fs.existsSync(path.join(dirPath, 'resume.pdf')),
            hasResumeDocx: fs.existsSync(path.join(dirPath, 'resume.docx')),
            hasCoverLetterPdf: fs.existsSync(path.join(dirPath, 'cover_letter.pdf')),
          });
        }
      }
    }
  }

  // Sort newest first
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Get all files from a specific saved application for a user.
 */
export function getApplication(folderName, userId = null) {
  const safeFolder = path.basename(folderName);
  let targetDir = null;

  if (userId) {
    const userAppDir = path.join(getUserApplicationsDir(userId), safeFolder);
    if (fs.existsSync(userAppDir)) {
      targetDir = userAppDir;
    }
  }

  if (!targetDir && fs.existsSync(USERS_DIR)) {
    try {
      const userFolders = fs.readdirSync(USERS_DIR);
      for (const u of userFolders) {
        const candidate = path.join(USERS_DIR, u, 'applications', safeFolder);
        if (fs.existsSync(candidate)) {
          targetDir = candidate;
          break;
        }
      }
    } catch {}
  }

  if (!targetDir) {
    const rootAppDir = path.join(APPLICATIONS_DIR, safeFolder);
    if (fs.existsSync(rootAppDir)) {
      targetDir = rootAppDir;
    }
  }

  if (!targetDir) return null;

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
    companyName: metadata?.companyName || '',
    roleTitle: metadata?.roleTitle || '',
    minRate: metadata?.minRate ?? null,
    maxRate: metadata?.maxRate ?? null,
    rateType: metadata?.rateType ?? null,
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
 * Get file path within an application bundle.
 */
export function getApplicationFilePath(folderName, fileName, userId = null) {
  const safeFolder = path.basename(folderName);
  const safeFile = path.basename(fileName);

  if (userId) {
    const userFilePath = path.join(getUserApplicationsDir(userId), safeFolder, safeFile);
    if (fs.existsSync(userFilePath)) {
      return userFilePath;
    }
  }

  if (fs.existsSync(USERS_DIR)) {
    try {
      const userFolders = fs.readdirSync(USERS_DIR);
      for (const u of userFolders) {
        const candidate = path.join(USERS_DIR, u, 'applications', safeFolder, safeFile);
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    } catch {}
  }

  const rootFilePath = path.join(APPLICATIONS_DIR, safeFolder, safeFile);
  if (fs.existsSync(rootFilePath)) {
    return rootFilePath;
  }

  return null;
}

/**
 * Read user profile.md (strictly returns user's file or empty string if not yet created).
 */
export function getProfile(userId = null) {
  if (!userId) return '';
  const userProfilePath = getUserProfilePath(userId);
  if (fs.existsSync(userProfilePath)) {
    return fs.readFileSync(userProfilePath, 'utf-8');
  }
  return '';
}

/**
 * Save updated user profile.md
 */
export function saveProfile(content, userId = null) {
  const userProfilePath = getUserProfilePath(userId);
  const dir = path.dirname(userProfilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(userProfilePath, content, 'utf-8');
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
