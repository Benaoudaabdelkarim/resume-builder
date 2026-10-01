import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runIntegrationTests() {
  console.log('🌐 Starting API End-to-End Integration tests...\n');

  // Dynamically start server or import app
  const expressModule = await import('express');
  const corsModule = await import('cors');
  const { createUser, authenticateUser, createSession, deleteSession } = await import('../server/db.js');
  const { authMiddleware, optionalAuthMiddleware } = await import('../server/auth.js');
  const {
    getProfile,
    saveProfile,
    saveApplicationBundle,
    listApplications,
    getApplication,
    getUserDir,
  } = await import('../server/storage.js');

  const app = expressModule.default();
  app.use(corsModule.default());
  app.use(expressModule.default.json({ limit: '50mb' }));

  // Mount identical endpoints as server/index.js
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }
      const user = createUser(name.trim(), email.trim(), password);
      const session = createSession(user.id);
      res.json({ success: true, token: session.token, user });
    } catch (err) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('already registered'))) {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const user = authenticateUser(email.trim(), password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const session = createSession(user.id);
      res.json({ success: true, token: session.token, user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', authMiddleware, (req, res) => {
    deleteSession(req.token);
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/profile', authMiddleware, (req, res) => {
    const content = getProfile(req.userId);
    res.json({ content });
  });

  app.post('/api/profile', authMiddleware, (req, res) => {
    saveProfile(req.body.content, req.userId);
    res.json({ success: true });
  });

  app.get('/api/applications', authMiddleware, (req, res) => {
    const list = listApplications(req.userId);
    res.json({ applications: list });
  });

  app.post('/api/save-bundle', authMiddleware, async (req, res) => {
    const result = await saveApplicationBundle(req.body, req.userId);
    res.json(result);
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`   🚀 Ephemeral test server running at ${baseUrl}`);

  const postJson = async (url, body, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    return { status: res.status, data: await res.json() };
  };

  const getJson = async (url, token = null) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    return { status: res.status, data: await res.json() };
  };

  const timestamp = Date.now();
  const u1Email = `api_user1_${timestamp}@test.com`;
  const u2Email = `api_user2_${timestamp}@test.com`;

  // Test 1: Register User 1
  console.log('\n1. Testing POST /api/auth/register:');
  const reg1 = await postJson(`${baseUrl}/auth/register`, {
    name: 'Sarah Connor',
    email: u1Email,
    password: 'Password123!',
  });
  assert.strictEqual(reg1.status, 200);
  assert.ok(reg1.data.token, 'Should return token');
  assert.strictEqual(reg1.data.user.name, 'Sarah Connor');
  const token1 = reg1.data.token;
  const user1Id = reg1.data.user.id;
  console.log('   ✅ User 1 registered with token');

  // Test 2: GET /api/auth/me
  console.log('\n2. Testing GET /api/auth/me:');
  const meRes = await getJson(`${baseUrl}/auth/me`, token1);
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.data.user.email, u1Email);
  console.log('   ✅ Validated Bearer token authentication on /api/auth/me');

  // Test 3: Unauthenticated request should be rejected
  const unauthRes = await getJson(`${baseUrl}/auth/me`);
  assert.strictEqual(unauthRes.status, 401, 'Should reject missing token with 401');
  console.log('   ✅ 401 Unauthorized correctly enforced without token');

  // Test 4: Profile isolation over HTTP
  console.log('\n3. Testing profile isolation via API:');
  await postJson(`${baseUrl}/profile`, { content: '# Sarah Connor Base Profile' }, token1);
  const p1Res = await getJson(`${baseUrl}/profile`, token1);
  assert.strictEqual(p1Res.data.content, '# Sarah Connor Base Profile');

  // Register User 2
  const reg2 = await postJson(`${baseUrl}/auth/register`, {
    name: 'John Connor',
    email: u2Email,
    password: 'Password456!',
  });
  const token2 = reg2.data.token;
  const user2Id = reg2.data.user.id;

  const p2Res = await getJson(`${baseUrl}/profile`, token2);
  assert.notStrictEqual(p2Res.data.content, '# Sarah Connor Base Profile', 'User 2 must not see Sarah profile');
  console.log('   ✅ User 1 and User 2 profiles are completely separated over HTTP');

  // Test 5: Applications isolation over HTTP
  console.log('\n4. Testing applications isolation via API:');
  await postJson(`${baseUrl}/save-bundle`, {
    companyName: 'Cyberdyne',
    roleTitle: 'Security Lead',
    jobPost: 'Defend against rogue AI',
  }, token1);

  const apps1 = await getJson(`${baseUrl}/applications`, token1);
  const apps2 = await getJson(`${baseUrl}/applications`, token2);

  assert.strictEqual(apps1.data.applications.length, 1);
  assert.strictEqual(apps1.data.applications[0].companyName, 'Cyberdyne');
  assert.strictEqual(apps2.data.applications.length, 0, 'User 2 must have 0 applications');
  console.log('   ✅ User 2 has 0 applications, User 1 has 1 application');

  // Test 6: Logout
  console.log('\n5. Testing logout:');
  const logoutRes = await postJson(`${baseUrl}/auth/logout`, {}, token1);
  assert.strictEqual(logoutRes.status, 200);

  const meAfterLogout = await getJson(`${baseUrl}/auth/me`, token1);
  assert.strictEqual(meAfterLogout.status, 401, 'Session should be invalidated');
  console.log('   ✅ Logout successfully revoked session token');

  // Cleanup
  fs.rmSync(getUserDir(user1Id), { recursive: true, force: true });
  fs.rmSync(getUserDir(user2Id), { recursive: true, force: true });
  server.close();

  console.log('\n🎉 ALL HTTP API INTEGRATION TESTS PASSED! 🚀');
}

runIntegrationTests().catch((err) => {
  console.error('\n❌ Integration test failed:', err);
  process.exit(1);
});
