import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Import DB and Storage modules
import {
  createUser,
  authenticateUser,
  createSession,
  getUserBySession,
  deleteSession,
} from '../server/db.js';

import {
  getProfile,
  saveProfile,
  saveApplicationBundle,
  listApplications,
  getApplication,
  getUserDir,
  getUserApplicationsDir,
  getUserProfilePath,
} from '../server/storage.js';

async function runTests() {
  console.log('🧪 Starting Auth & Multi-tenant Storage tests...\n');

  const timestamp = Date.now();
  const user1Email = `user1_${timestamp}@example.com`;
  const user2Email = `user2_${timestamp}@example.com`;

  // 1. User Registration with ONLY name, email, password
  console.log('1️⃣ Testing user registration with only name, email, password:');
  const user1 = createUser('Alice Walker', user1Email, 'SecurePass123!');
  assert.ok(user1.id, 'User 1 should have an ID');
  assert.strictEqual(user1.name, 'Alice Walker');
  assert.strictEqual(user1.email, user1Email);
  console.log(`   ✅ User 1 registered (ID: ${user1.id}, Name: ${user1.name})`);

  // Prevent duplicate registration
  assert.throws(() => {
    createUser('Duplicate Alice', user1Email, 'Password123!');
  }, /already exists/, 'Should disallow duplicate email registration');
  console.log('   ✅ Duplicate email correctly blocked.');

  const user2 = createUser('Bob Martin', user2Email, 'PasswordBob456!');
  assert.ok(user2.id, 'User 2 should have an ID');
  assert.notStrictEqual(user1.id, user2.id, 'User IDs must be unique');
  console.log(`   ✅ User 2 registered (ID: ${user2.id}, Name: ${user2.name})`);

  // 2. Authentication & Session handling
  console.log('\n2️⃣ Testing authentication & sessions:');
  const authFailed = authenticateUser(user1Email, 'WrongPassword');
  assert.strictEqual(authFailed, null, 'Authentication must fail on wrong password');
  console.log('   ✅ Wrong password rejected.');

  const authSuccess = authenticateUser(user1Email, 'SecurePass123!');
  assert.ok(authSuccess, 'Authentication must succeed with correct password');
  assert.strictEqual(authSuccess.id, user1.id);
  console.log('   ✅ Correct password authenticated.');

  const session1 = createSession(user1.id);
  assert.ok(session1.token, 'Session token should be created');
  const sessionUser = getUserBySession(session1.token);
  assert.strictEqual(sessionUser.id, user1.id, 'Session should resolve to User 1');
  console.log('   ✅ Session created and validated via token.');

  deleteSession(session1.token);
  const deletedSessionUser = getUserBySession(session1.token);
  assert.strictEqual(deletedSessionUser, null, 'Deleted session must no longer resolve user');
  console.log('   ✅ Session logout and deletion verified.');

  // 3. Multi-tenant Profile isolation
  console.log('\n3️⃣ Testing multi-tenant Profile (.md) isolation:');
  const user1ProfilePath = getUserProfilePath(user1.id);
  const user2ProfilePath = getUserProfilePath(user2.id);
  assert.ok(user1ProfilePath.includes(String(user1.id)), 'User 1 profile path must be scoped to User 1 ID');
  assert.ok(user2ProfilePath.includes(String(user2.id)), 'User 2 profile path must be scoped to User 2 ID');

  // Verify new user has completely empty profile (no seeding from root template)
  const initialUser1Profile = getProfile(user1.id);
  assert.strictEqual(initialUser1Profile, '', 'New user profile must start empty with no root seeding');
  console.log('   ✅ Confirmed: New user has NO seeded profile (starts empty).');

  const customProfileUser1 = `# Alice Walker\n## Senior AI Engineer\n- Expertise in LLM workflows`;
  saveProfile(customProfileUser1, user1.id);

  const customProfileUser2 = `# Bob Martin\n## Full Stack Developer\n- Expertise in React and Node.js`;
  saveProfile(customProfileUser2, user2.id);

  const loadedUser1Profile = getProfile(user1.id);
  const loadedUser2Profile = getProfile(user2.id);

  assert.strictEqual(loadedUser1Profile, customProfileUser1, 'User 1 profile should match custom profile 1');
  assert.strictEqual(loadedUser2Profile, customProfileUser2, 'User 2 profile should match custom profile 2');
  assert.notStrictEqual(loadedUser1Profile, loadedUser2Profile, 'Profiles must be completely isolated between users');
  console.log('   ✅ User 1 and User 2 have separate, isolated profile.md files.');

  // 4. Multi-tenant Application isolation
  console.log('\n4️⃣ Testing multi-tenant Application isolation:');
  const app1Bundle = await saveApplicationBundle({
    companyName: 'OpenAI',
    roleTitle: 'Research Scientist',
    jobPost: 'Build next-gen models',
    resumeData: { personalInfo: { fullName: 'Alice Walker' } },
  }, user1.id);

  const user1Apps = listApplications(user1.id);
  const user2Apps = listApplications(user2.id);

  assert.strictEqual(user1Apps.length, 1, 'User 1 should have exactly 1 application');
  assert.strictEqual(user1Apps[0].companyName, 'OpenAI');
  assert.strictEqual(user2Apps.length, 0, 'User 2 must NOT see User 1 applications (must be 0)');
  console.log('   ✅ User 1 application saved. User 2 sees 0 applications.');

  const app2Bundle = await saveApplicationBundle({
    companyName: 'Google',
    roleTitle: 'Software Engineer',
    jobPost: 'Build scalable systems',
    resumeData: { personalInfo: { fullName: 'Bob Martin' } },
  }, user2.id);

  const user1AppsUpdated = listApplications(user1.id);
  const user2AppsUpdated = listApplications(user2.id);

  assert.strictEqual(user1AppsUpdated.length, 1, 'User 1 should still have only 1 application');
  assert.strictEqual(user2AppsUpdated.length, 1, 'User 2 should have only 1 application');
  assert.strictEqual(user1AppsUpdated[0].companyName, 'OpenAI');
  assert.strictEqual(user2AppsUpdated[0].companyName, 'Google');
  console.log('   ✅ Applications are strictly isolated per user directory!');

  // Cleanup test user directories
  fs.rmSync(getUserDir(user1.id), { recursive: true, force: true });
  fs.rmSync(getUserDir(user2.id), { recursive: true, force: true });
  console.log('   ✅ Test directories cleaned up.');

  console.log('\n🎉 ALL AUTH & MULTI-TENANT TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
