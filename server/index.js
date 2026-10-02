import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { testGeminiKey, generateAtsApplication } from './gemini.js';
import {
  getProfile,
  saveProfile,
  getStoredApiKey,
  saveApiKeyToEnv,
  saveApplicationBundle,
  listApplications,
  getApplication,
  getApplicationFilePath,
  resumeJsonToMarkdown,
} from './storage.js';
import {
  createUser,
  authenticateUser,
  createSession,
  getUserBySession,
  deleteSession,
  updateUserPassword,
} from './db.js';
import { authMiddleware, optionalAuthMiddleware } from './auth.js';
import { extractSalaryInfo } from './salaryExtractor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const APPLICATIONS_DIR = path.join(ROOT_DIR, 'applications');

const app = express();
const PORT = process.env.PORT || 3001; // Reloaded for dev terminal

// Allow large payloads for base64 PDFs
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health / Status check
app.get('/api/status', optionalAuthMiddleware, (req, res) => {
  const profile = getProfile(req.userId);
  res.json({
    status: 'online',
    hasProfile: Boolean(profile && profile.trim().length > 0),
    profileLength: profile ? profile.length : 0,
    user: req.user || null,
  });
});

// Auth: Register with Name, Email, Password
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid name (at least 2 characters).' });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = createUser(name.trim(), email.trim(), password);
    const session = createSession(user.id);
    res.json({
      success: true,
      token: session.token,
      user,
    });
  } catch (err) {
    if (err.message && (err.message.includes('already exists') || err.message.includes('already registered'))) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Auth: Login with Email & Password
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = authenticateUser(email.trim(), password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const session = createSession(user.id);
    res.json({
      success: true,
      token: session.token,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Auth: Current logged in user info
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Auth: Logout
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  try {
    deleteSession(req.token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Change password
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    // Verify current password first
    const authenticated = authenticateUser(req.user.email, currentPassword);
    if (!authenticated) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    updateUserPassword(req.user.email, newPassword);

    // Issue a fresh new session token
    const newSession = createSession(req.user.id);
    res.json({
      success: true,
      message: 'Password changed successfully.',
      token: newSession.token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update password.' });
  }
});

// Test Gemini API Key (validates key without altering server-side .env)
app.post('/api/test-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const testResult = await testGeminiKey(apiKey);
    if (!testResult.success) {
      return res.status(400).json({ error: `API Key test failed: ${testResult.error}` });
    }

    res.json({ success: true, message: 'Gemini API Key is valid and working!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy/Compatibility API Key endpoint
app.post('/api/api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const testResult = await testGeminiKey(apiKey);
    if (!testResult.success) {
      return res.status(400).json({ error: `API Key test failed: ${testResult.error}` });
    }

    saveApiKeyToEnv(apiKey);
    res.json({ success: true, message: 'Gemini API Key verified and saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Job Description from URL
app.post('/api/fetch-job-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Please enter a valid URL starting with http:// or https://' });
    }

    // 1. RisePeople ATS handler
    if (url.includes('careers.risepeople.com')) {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const companySlug = parts[0];
      const posMatch = parsed.pathname.match(/(\d+)/);
      const posId = posMatch ? posMatch[1] : null;

      if (companySlug && posId) {
        const apiUrl = `https://gateway.risepeople.com/applicant_tracking/public/positions/${posId}?company_uri=${companySlug}&language=en`;
        const apiRes = await fetch(apiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          const descObj = apiData.descriptions?.[0] || {};
          const title = descObj.title || '';
          const companyFormatted = companySlug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          const location = [descObj.city, descObj.province, descObj.country].filter(Boolean).join(', ');

          let text = descObj.description || '';
          text = text
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

          const cleanLines = text
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          const fullCleanText = cleanLines.join('\n').slice(0, 20000);
          const salary = extractSalaryInfo(fullCleanText);
          return res.json({
            success: true,
            url,
            title,
            company: companyFormatted,
            location,
            text: fullCleanText,
            minRate: salary.minRate,
            maxRate: salary.maxRate,
            rateType: salary.rateType,
          });
        }
      }
    }

    // 2. Greenhouse ATS handler
    if (url.includes('boards.greenhouse.io') || url.includes('job-boards.greenhouse.io')) {
      const match = url.match(/greenhouse\.io\/(?:embed\/job_board\/)?([^\/]+)\/jobs\/(\d+)/);
      if (match) {
        const [, board, id] = match;
        const apiRes = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${id}`);
        if (apiRes.ok) {
          const job = await apiRes.json();
          const cleanContent = (job.content || '')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
          const fullText = cleanContent.slice(0, 20000);
          const salary = extractSalaryInfo(fullText);
          return res.json({
            success: true,
            url,
            title: job.title || '',
            company: board.charAt(0).toUpperCase() + board.slice(1),
            location: job.location?.name || '',
            text: fullText,
            minRate: salary.minRate,
            maxRate: salary.maxRate,
            rateType: salary.rateType,
          });
        }
      }
    }

    // 3. Lever ATS handler
    if (url.includes('jobs.lever.co')) {
      const match = url.match(/jobs\.lever\.co\/([^\/]+)\/([a-zA-Z0-9\-]+)/);
      if (match) {
        const [, company, id] = match;
        const apiRes = await fetch(`https://api.lever.co/v0/postings/${company}/${id}`);
        if (apiRes.ok) {
          const job = await apiRes.json();
          const text = `${job.text || ''}\n\n${job.descriptionPlain || ''}\n\n${(job.lists || []).map((l) => `${l.text}:\n${l.content}`).join('\n\n')}`;
          const fullText = text.slice(0, 20000);
          const salary = extractSalaryInfo(fullText);
          return res.json({
            success: true,
            url,
            title: job.text || '',
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: job.categories?.location || '',
            text: fullText,
            minRate: salary.minRate,
            maxRate: salary.maxRate,
            rateType: salary.rateType,
          });
        }
      }
    }

    // 4. Check for known bot-protected sites
    if (url.includes('indeed.') || url.includes('linkedin.')) {
      return res.status(403).json({
        error: 'Indeed and LinkedIn block external server scrapers with Cloudflare Turnstile.',
        isProtected: true,
      });
    }

    // 5. Standard Web Page Fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Could not fetch page (HTTP ${response.status}). Please paste the job description text directly.`,
      });
    }

    const html = await response.text();

    // 5. Check for Schema.org JobPosting JSON-LD (used by RBC, Phenom, Workday, Taleo, etc.)
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    for (const m of jsonLdMatches) {
      try {
        const parsed = JSON.parse(m[1]);
        if (parsed && (parsed['@type'] === 'JobPosting' || parsed.title)) {
          const jobTitle = parsed.title || '';
          const companyName = parsed.hiringOrganization?.name || '';
          const rawDesc = parsed.description || '';

          let cleanDesc = rawDesc
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<[^>]+>/g, ' ');

          const lines = cleanDesc
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          const fullText = lines.join('\n');
          if (fullText.length > 80) {
            const salary = extractSalaryInfo(fullText, parsed);
            return res.json({
              success: true,
              url,
              title: jobTitle,
              company: companyName,
              text: fullText.slice(0, 20000),
              minRate: salary.minRate,
              maxRate: salary.maxRate,
              rateType: salary.rateType,
            });
          }
        }
      } catch {}
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Strip scripts, styles, svg, header, footer, nav
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');

    // Replace line break tags
    clean = clean.replace(/<br\s*[\/]?>/gi, '\n');
    clean = clean.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
    clean = clean.replace(/<li[^>]*>/gi, '• ');

    // Strip remaining HTML tags
    clean = clean.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    clean = clean
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const lines = clean
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const text = lines.join('\n');

    if (text.length < 80) {
      return res.status(400).json({
        error: 'The page returned very little text (it may be a Single-Page JavaScript app). Please paste the job description directly.',
      });
    }

    const salary = extractSalaryInfo(text);
    res.json({
      success: true,
      url,
      title,
      text: text.slice(0, 20000),
      minRate: salary.minRate,
      maxRate: salary.maxRate,
      rateType: salary.rateType,
    });
  } catch (error) {
    res.status(500).json({
      error: `Could not fetch job description from URL: ${error.message}. You can copy & paste the job text directly.`,
    });
  }
});

// Clip Job from Browser Extension / Bookmarklet
let latestJobClip = null;

app.post('/api/clip-job', (req, res) => {
  const { url, title, text, company } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }
  latestJobClip = {
    url: url || '',
    title: title || '',
    company: company || '',
    text: text || '',
    timestamp: Date.now(),
  };
  res.json({ success: true, message: 'Job successfully clipped to ATS Studio!' });
});

app.get('/api/clip-job', (req, res) => {
  if (latestJobClip) {
    const clip = { ...latestJobClip };
    latestJobClip = null; // consume
    return res.json({ clip });
  }
  res.json({ clip: null });
});

// Profile endpoints
app.get('/api/profile', authMiddleware, (req, res) => {
  try {
    const content = getProfile(req.userId);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Profile content must be a string' });
    }
    saveProfile(content, req.userId);
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Tailored Application
app.post('/api/generate', optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      apiKey: customKey,
      modelName = 'gemini-2.5-flash',
      profileMd: customProfile,
      jobPost,
      companyName,
      roleTitle,
      notes,
    } = req.body;

    const apiKey = customKey || getStoredApiKey();
    if (!apiKey) {
      return res.status(400).json({
        error: 'Gemini API Key missing. Please provide your Gemini API key in settings or pass it in.',
      });
    }

    const profileMd = customProfile || getProfile(req.userId);
    if (!profileMd || !profileMd.trim()) {
      return res.status(400).json({
        error: 'Base profile is empty. Please provide your base resume markdown in the profile tab.',
      });
    }

    if (!jobPost || !jobPost.trim()) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    const result = await generateAtsApplication({
      apiKey,
      modelName,
      profileMd,
      jobPost,
      companyName,
      roleTitle,
      notes,
    });

    if (result && result.resume) {
      result.resumeMarkdown = resumeJsonToMarkdown(result.resume);
    }

    if (result && result.coverLetter) {
      result.coverLetter.date = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    res.json({ success: true, data: result, ...result });
  } catch (error) {
    console.error('Error generating application:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

// Save Application Bundle
app.post('/api/save-bundle', optionalAuthMiddleware, async (req, res) => {
  try {
    const result = await saveApplicationBundle(req.body, req.userId);
    res.json(result);
  } catch (error) {
    console.error('Error saving bundle:', error);
    res.status(500).json({ error: error.message || 'Failed to save bundle' });
  }
});

// List saved applications
app.get('/api/applications', optionalAuthMiddleware, (req, res) => {
  try {
    const list = listApplications(req.userId);
    res.json({ applications: list, total: list.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific application bundle
app.get('/api/applications/:folderName', optionalAuthMiddleware, (req, res) => {
  try {
    const data = getApplication(req.params.folderName, req.userId);
    if (!data) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve a specific file from a bundle (e.g. resume.pdf)
app.get('/api/applications/:folderName/file/:fileName', optionalAuthMiddleware, (req, res) => {
  try {
    const filePath = getApplicationFilePath(req.params.folderName, req.params.fileName, req.userId);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve production static frontend if dist/ exists
const DIST_DIR = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
