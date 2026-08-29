import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rulesUrl = new URL('../../firestore.rules', import.meta.url);

test('Firestore rules keep wallets private and voucher lookups authenticated', async () => {
  const rules = await readFile(rulesUrl, 'utf8');
  assert.match(rules, /match \/joyWallets\/\{uid\}/);
  assert.match(rules, /allow get: if isOwner\(uid\)/);
  assert.match(rules, /allow list: if false/);
  assert.match(rules, /match \/joyVouchers\/\{code\}/);
  assert.match(rules, /allow get: if signedIn\(\)/);
  assert.match(rules, /allow list: if signedIn\(\)\s*&&\s*resource\.data\.ownerUid == request\.auth\.uid/);
});

test('Firestore rules encode fixed tiers and paired redemption writes', async () => {
  const rules = await readFile(rulesUrl, 'utf8');
  for (const fragment of [
    "tierId == 'rm1' && data.coinCost == 100 && data.valueSen == 100 && data.minSubtotalSen == 1000",
    "tierId == 'rm2' && data.coinCost == 200 && data.valueSen == 200 && data.minSubtotalSen == 1500",
    "tierId == 'rm5' && data.coinCost == 500 && data.valueSen == 500 && data.minSubtotalSen == 2000",
    'pairedRedemption(code)',
    "walletAfter.lastMutationType == 'redeem'",
  ]) {
    assert.ok(rules.includes(fragment), `missing rule contract: ${fragment}`);
  }
});

test('Firestore rules name every legal voucher lifecycle transition', async () => {
  const rules = await readFile(rulesUrl, 'utf8');
  for (const functionName of [
    'validReservation()',
    'sameReservation()',
    'validCustomerRelease()',
    'validAdminConsumption()',
    'validAdminRestoration()',
    'sameSettledVoucher()',
  ]) {
    assert.ok(rules.includes(functionName), `missing transition: ${functionName}`);
  }
});
