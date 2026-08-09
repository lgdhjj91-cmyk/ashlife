import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as adminAuthRules from './adminAuthRules.js';

test('non-anonymous Firebase users can access admin', () => {
  assert.equal(typeof adminAuthRules.canAccessAdmin, 'function');
  assert.equal(adminAuthRules.canAccessAdmin({ isAnonymous: false }), true);
  assert.equal(adminAuthRules.canAccessAdmin({ isAnonymous: true }), false);
  assert.equal(adminAuthRules.canAccessAdmin(null), false);
});

test('database admin data allows non-anonymous authenticated users', () => {
  const rules = JSON.parse(
    readFileSync(new URL('../../firebase.database.rules.json', import.meta.url), 'utf8')
  ).rules;
  const signedInUser = "auth != null && auth.token.firebase.sign_in_provider != 'anonymous'";

  assert.equal(rules.products['.write'], signedInUser);
  assert.equal(rules.settings.siteContent['.write'], signedInUser);
  assert.equal(rules.settings.payment['.write'], signedInUser);
  assert.equal(rules.orders['.read'], signedInUser);
  assert.match(rules.orders.$orderId['.write'], /sign_in_provider != 'anonymous'/);
  assert.doesNotMatch(JSON.stringify(rules), /auth\.token\.admin/);
});

test('GitHub Pages build has no obsolete admin credentials', () => {
  const workflow = readFileSync(
    new URL('../../.github/workflows/deploy.yml', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(workflow, /VITE_ADMIN_(USER|PASS)/);
});
