import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  getProfile,
  resumeJsonToMarkdown,
  coverLetterToText,
  saveApplicationBundle,
  listApplications,
  getApplication,
} from '../server/storage.js';

console.log('--- Starting Storage & Formatter Tests ---');

// 1. Verify getProfile reads profile.md
const profile = getProfile();
assert(profile.length > 50, 'profile.md should have content');
console.log('✓ profile.md loaded correctly, length:', profile.length);

// 2. Verify resumeJsonToMarkdown
const testResume = {
  personalInfo: {
    fullName: 'Jane Doe',
    headline: 'Senior AI Engineer',
    email: 'jane@example.com',
    location: 'New York, NY',
  },
  summary: 'Experienced AI engineer with proven track record.',
  skills: [
    { category: 'Languages', items: ['Python', 'JavaScript'] },
  ],
  experience: [
    {
      role: 'Staff Engineer',
      company: 'Acme Corp',
      period: '2022 - Present',
      bullets: ['Scaled inference cluster by 300%.'],
    },
  ],
};

const md = resumeJsonToMarkdown(testResume);
assert(md.includes('# Jane Doe'), 'Markdown should include full name');
assert(md.includes('Senior AI Engineer'), 'Markdown should include headline');
assert(md.includes('Scaled inference cluster'), 'Markdown should include bullet point');
console.log('✓ resumeJsonToMarkdown verified');

// 3. Verify coverLetterToText
const testLetter = {
  recipient: 'Hiring Team',
  company: 'Target Corp',
  date: 'September 25, 2026',
  greeting: 'Dear Team,',
  bodyParagraphs: ['Paragraph 1', 'Paragraph 2'],
  signOff: 'Best,',
  senderName: 'Jane Doe',
};
const clText = coverLetterToText(testLetter);
assert(clText.includes('Target Corp'), 'Cover letter text should include company');
assert(clText.includes('Paragraph 1'), 'Cover letter text should include body');
console.log('✓ coverLetterToText verified');

// 4. Verify saveApplicationBundle
const saveRes = await saveApplicationBundle({
  companyName: 'TestCo',
  roleTitle: 'Lead Architect',
  jobPost: 'We are looking for a Lead Architect...',
  jobUrl: 'https://testco.com/careers/lead-architect',
  notes: 'Focus on high throughput',
  resumeData: testResume,
  coverLetterData: testLetter,
  templateId: 'modern',
});

assert(saveRes.success, 'saveApplicationBundle should succeed');
assert(fs.existsSync(saveRes.targetDir), 'Bundle target directory should exist');
assert(fs.existsSync(path.join(saveRes.targetDir, 'job_post.txt')), 'job_post.txt should exist');
assert(fs.existsSync(path.join(saveRes.targetDir, 'job_url.txt')), 'job_url.txt should exist');
assert(fs.existsSync(path.join(saveRes.targetDir, 'notes.txt')), 'notes.txt should exist');
assert(fs.existsSync(path.join(saveRes.targetDir, 'resume.json')), 'resume.json should exist');
assert(fs.existsSync(path.join(saveRes.targetDir, 'cover_letter.txt')), 'cover_letter.txt should exist');
console.log('✓ saveApplicationBundle created all bundle files in:', saveRes.folderName);

// 5. Verify listApplications
const apps = listApplications();
assert(apps.length > 0, 'listApplications should return saved bundle');
assert(apps.some((a) => a.companyName === 'TestCo'), 'Saved app should be listed');
console.log('✓ listApplications verified, found:', apps.length, 'saved application(s)');

// 6. Verify getApplication
const loaded = getApplication(saveRes.folderName);
assert(loaded !== null, 'getApplication should return data');
assert.strictEqual(loaded.metadata.companyName, 'TestCo');
assert.strictEqual(loaded.jobUrl, 'https://testco.com/careers/lead-architect');
assert.strictEqual(loaded.notes, 'Focus on high throughput');
assert(loaded.resumeMarkdown.includes('# Jane Doe'));
console.log('✓ getApplication loaded bundle successfully with jobUrl');

// Clean up test folder
fs.rmSync(saveRes.targetDir, { recursive: true, force: true });
console.log('✓ Cleaned up test bundle');

console.log('\n--- All Automated Verification Tests Passed! ---');
