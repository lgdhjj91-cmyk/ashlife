import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAdminClaim } from './adminAuthRules.js';

test('only the explicit admin custom claim grants admin access', () => {
  assert.equal(hasAdminClaim({ claims: { admin: true } }), true);
  assert.equal(hasAdminClaim({ claims: { admin: false } }), false);
  assert.equal(hasAdminClaim({ claims: {} }), false);
  assert.equal(hasAdminClaim(null), false);
});
