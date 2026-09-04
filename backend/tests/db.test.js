import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';

test('database stores registration, updates, rewards, and login events', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'literaai-store-'));
  process.env.DATA_DIR = tmp;

  const modUrl = pathToFileURL(path.resolve('src/services/db.js')).href + `?t=${Date.now()}`;
  const mod = await import(modUrl);

  const status = await mod.assertStoreWritable();
  assert.equal(status.ok, true);
  assert.equal(status.engine, 'supabase-postgresql');

  const user = await mod.createUser({
    name: 'T. SURYA',
    email: 'suryatamilendkran@gmail.com',
    password: 'hash-Password1',
    preferred_language: 'en',
    education_level: 'Primary School',
  });
  assert.equal(user.email, 'suryatamilendkran@gmail.com');
  assert.equal(user.password, undefined);

  let threw = false;
  try {
    await mod.createUser({
      name: 'Dup',
      email: 'suryatamilendkran@gmail.com',
      password: 'hash-Password1',
      preferred_language: 'en',
      education_level: 'Primary School',
    });
  } catch (err) {
    threw = true;
    assert.equal(err.status, 409);
  }
  assert.equal(threw, true);

  const found = await mod.getUserWithPassword('suryatamilendkran@gmail.com');
  assert.equal(found.password, 'hash-Password1');

  const goalUpdated = await mod.updateUser(found.id, { streak: { goal: 30 } });
  assert.equal(goalUpdated.streak.goal, 30);

  const firstReward = await mod.awardUserReward(found.id, {
    eventId: 'writing-session-1:challenge:0', xp: 10, gems: 1,
  });
  assert.equal(firstReward.xp, 10);
  assert.equal(firstReward.gems, 1);
  const retriedReward = await mod.awardUserReward(found.id, {
    eventId: 'writing-session-1:challenge:0', xp: 10, gems: 1,
  });
  assert.equal(retriedReward.xp, 10, 'a retried reward event must not add XP again');
  assert.equal(retriedReward.gems, 1, 'a retried reward event must not add gems again');

  const bronzeCertificate = await mod.promoteUserLeague(
    found.id,
    'silver',
    'bronze',
    'Bronze League',
    100,
  );
  assert.equal(bronzeCertificate.league, 'bronze', 'passing Bronze issues a Bronze certificate');
  assert.equal((await mod.findUserById(found.id)).league, 'silver', 'passing Bronze unlocks Silver');

  await mod.recordLoginEvent({
    userId: found.id,
    email: found.email,
    success: true,
    ip: '127.0.0.1',
  });
  await mod.recordLoginEvent({
    userId: null,
    email: 'nope@example.com',
    success: false,
  });

  const finalStatus = await mod.getDbStatus();
  assert.equal(finalStatus.users, 1);
  assert.equal(finalStatus.registrations, 1);
  assert.equal(finalStatus.login_events, 2);
});
