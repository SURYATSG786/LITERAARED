import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';
import { hashPassword, comparePassword } from '../src/utils/auth.js';

test('register + login round-trip stores learner and allows login', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'literaai-auth-'));
  process.env.DATA_DIR = tmp;

  const db = await import(pathToFileURL(path.resolve('src/services/db.js')).href + `?auth=${Date.now()}`);
  const password = 'Password1';
  const created = await db.createUser({
    name: 'Student One',
    email: 'student1@school.test',
    password: hashPassword(password),
    preferred_language: 'ta',
    education_level: 'Primary School',
  });

  assert.ok(created.id);
  assert.equal((await db.listUsers()).length, 1);

  const row = await db.getUserWithPassword('student1@school.test');
  assert.equal(comparePassword(password, row.password), true);
  assert.equal(comparePassword('WrongPass1', row.password), false);

  const selectedPair = await db.updateUser(row.id, { uiLanguage: 'en', learningLanguage: 'ml' });
  assert.equal(selectedPair.uiLanguage, 'en');
  assert.equal(selectedPair.learningLanguage, 'ml');

  await db.recordLoginEvent({ userId: row.id, email: row.email, success: true });
  const status = await db.getDbStatus();
  assert.equal(status.engine, 'supabase-postgresql');
  assert.equal(status.users, 1);
  assert.equal(status.login_events, 1);
});
