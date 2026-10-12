import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeSession, readSessionToken, writeSessionToken, clearSessionToken } from '../src/auth/session.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('legacy persistent accounts never sign in automatically', () => {
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  localStorage.setItem('literaai_token', 'previous-account');
  assert.equal(initializeSession('/dashboard'), null);
  assert.equal(localStorage.getItem('literaai_token'), null);
});

test('login, registration, and admin entry require explicit authentication', () => {
  for (const route of ['/login', '/register', '/mentor-login', '/login/']) {
    globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
    writeSessionToken('account-a');
    assert.equal(initializeSession(route), null);
  }
});

test('refresh retains the current tab account, switching replaces it, logout removes it', () => {
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  writeSessionToken('account-a');
  assert.equal(initializeSession('/courses'), 'account-a');
  writeSessionToken('account-b');
  assert.equal(readSessionToken(), 'account-b');
  assert.equal(localStorage.getItem('literaai_token'), null);
  clearSessionToken();
  assert.equal(readSessionToken(), null);
});
