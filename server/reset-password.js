#!/usr/bin/env node
import { db, updateUserPassword } from './db.js';

const args = process.argv.slice(2);
const email = args[0]?.trim();
const newPassword = args[1]?.trim();

console.log('=============================================');
console.log('   ATS Resume Studio - Password Reset Tool   ');
console.log('=============================================\n');

if (!email || !newPassword) {
  console.log('Usage:');
  console.log('  node server/reset-password.js <email> <new_password>\n');
  console.log('Example:');
  console.log('  node server/reset-password.js user@example.com "MyNewSecret123"\n');

  try {
    const users = db.prepare('SELECT id, name, email, created_at FROM users').all();
    if (users && users.length > 0) {
      console.log('Existing users in database:');
      users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.name} (${u.email}) [ID: ${u.id}]`);
      });
      console.log('');
    } else {
      console.log('No users found in database.\n');
    }
  } catch (err) {
    console.error('Could not query users list:', err.message);
  }

  process.exit(1);
}

try {
  const result = updateUserPassword(email, newPassword);
  console.log(`✅ Success! Password updated for:`);
  console.log(`   Name:  ${result.name}`);
  console.log(`   Email: ${result.email}`);
  console.log(`   ID:    ${result.id}`);
  console.log('\nAll previous active sessions have been terminated.');
  console.log('The user can now log in with their new password.');
  process.exit(0);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
}
