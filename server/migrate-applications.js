import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const APPLICATIONS_DIR = path.join(ROOT_DIR, 'applications');
const USERS_DIR = path.join(ROOT_DIR, 'data', 'users');

console.log('==============================================');
console.log('   ATS Application Storage Migration & Cleanup');
console.log('==============================================');

// 1. Fetch registered users
const users = db.prepare('SELECT id, name, email FROM users').all();
console.log(`Found ${users.length} registered user(s):`);
users.forEach(u => console.log(` - [${u.id}] ${u.name} <${u.email}>`));

if (!fs.existsSync(APPLICATIONS_DIR)) {
  console.log('No root applications directory found. Nothing to migrate.');
  process.exit(0);
}

const entries = fs.readdirSync(APPLICATIONS_DIR, { withFileTypes: true });
const appFolders = entries.filter(e => e.isDirectory()).map(e => e.name);

console.log(`\nFound ${appFolders.length} folder(s) in root /applications:`);

let migratedCount = 0;
let cleanedDuplicateCount = 0;
let unassignedCount = 0;

for (const folder of appFolders) {
  const rootFolderPath = path.join(APPLICATIONS_DIR, folder);

  // Check if this folder already exists in any user folder
  let existingUser = null;
  for (const user of users) {
    const userAppPath = path.join(USERS_DIR, user.id, 'applications', folder);
    if (fs.existsSync(userAppPath)) {
      existingUser = user;
      break;
    }
  }

  if (existingUser) {
    console.log(`[DUPLICATE] "${folder}" already exists for ${existingUser.name} (${existingUser.email}). Removing root copy.`);
    fs.rmSync(rootFolderPath, { recursive: true, force: true });
    cleanedDuplicateCount++;
    continue;
  }

  // Not in any user folder yet: inspect resume.json or metadata.json
  const resumeJsonPath = path.join(rootFolderPath, 'resume.json');
  let matchedUser = null;

  if (fs.existsSync(resumeJsonPath)) {
    try {
      const resumeData = JSON.parse(fs.readFileSync(resumeJsonPath, 'utf-8'));
      const candidateEmail = (resumeData?.contact?.email || resumeData?.basics?.email || '').trim().toLowerCase();
      const candidateName = (resumeData?.contact?.name || resumeData?.basics?.name || '').trim().toLowerCase();

      matchedUser = users.find(u => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.name || '').trim().toLowerCase();
        if (candidateEmail && uEmail && candidateEmail === uEmail) return true;
        if (candidateName && uName && candidateName.includes(uName)) return true;
        return false;
      });
    } catch (e) {
      console.warn(`Could not parse resume.json in "${folder}": ${e.message}`);
    }
  }

  if (matchedUser) {
    const targetUserAppsDir = path.join(USERS_DIR, matchedUser.id, 'applications');
    fs.mkdirSync(targetUserAppsDir, { recursive: true });
    const destinationPath = path.join(targetUserAppsDir, folder);

    console.log(`[MIGRATING] "${folder}" -> User: ${matchedUser.name} (${matchedUser.email})`);
    fs.cpSync(rootFolderPath, destinationPath, { recursive: true });
    fs.rmSync(rootFolderPath, { recursive: true, force: true });
    migratedCount++;
  } else {
    console.log(`[UNASSIGNED] "${folder}" could not be automatically matched to a user. Kept in root.`);
    unassignedCount++;
  }
}

console.log('\nMigration complete summary:');
console.log(` - Migrated to user folders: ${migratedCount}`);
console.log(` - Removed root duplicates:  ${cleanedDuplicateCount}`);
console.log(` - Unassigned/Kept in root:  ${unassignedCount}`);
console.log('==============================================\n');
