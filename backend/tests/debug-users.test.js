import test from 'node:test';
import { listUsers } from '../src/services/db.js';

test('debug: print all users in database', async () => {
  try {
    const users = await listUsers();
    console.log('=== USERS IN DATABASE ===');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.log('Users not reachable:', err.message);
  }
});
