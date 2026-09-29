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
  resumeJsonToMarkdown,
} from './storage.js';

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
app.get('/api/status', (req, res) => {
  const key = getStoredApiKey();
  const profile = getProfile();
  res.json({
    status: 'online',
    hasKey: Boolean(key),
    maskedKey: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    hasProfile: Boolean(profile && profile.trim().length > 0),
    profileLength: profile.length,
  });
});

// Test and save API Key
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

          return res.json({
            success: true,
            url,
            title,
            company: companyFormatted,
            location,
            text: cleanLines.join('\n').slice(0, 20000),
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
          return res.json({
            success: true,
            url,
            title: job.title || '',
            company: board.charAt(0).toUpperCase() + board.slice(1),
            location: job.location?.name || '',
            text: cleanContent.slice(0, 20000),
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
          return res.json({
            success: true,
            url,
            title: job.text || '',
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: job.categories?.location || '',
            text: text.slice(0, 20000),
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

    res.json({
      success: true,
      url,
      title,
      text: text.slice(0, 20000),
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
app.get('/api/profile', (req, res) => {
  try {
    const content = getProfile();
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Profile content must be a string' });
    }
    saveProfile(content);
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Tailored Application
app.post('/api/generate', async (req, res) => {
  try {
    const {
      apiKey: customKey,
      modelName = 'gemini-1.5-flash',
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

    const profileMd = customProfile || getProfile();
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

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error generating application:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

// Save Application Bundle
app.post('/api/save-bundle', async (req, res) => {
  try {
    const result = await saveApplicationBundle(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error saving bundle:', error);
    res.status(500).json({ error: error.message || 'Failed to save bundle' });
  }
});

// List saved applications
app.get('/api/applications', (req, res) => {
  try {
    const list = listApplications();
    res.json({ applications: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific application bundle
app.get('/api/applications/:folderName', (req, res) => {
  try {
    const data = getApplication(req.params.folderName);
    if (!data) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve a specific file from a bundle (e.g. resume.pdf)
app.get('/api/applications/:folderName/file/:fileName', (req, res) => {
  try {
    const safeFolder = path.basename(req.params.folderName);
    const safeFile = path.basename(req.params.fileName);
    const filePath = path.join(APPLICATIONS_DIR, safeFolder, safeFile);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
