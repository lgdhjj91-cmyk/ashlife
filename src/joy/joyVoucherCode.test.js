import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JOY_CODE_ALPHABET,
  createJoyVoucherCode,
  isJoyVoucherCode,
} from './joyVoucherCode.js';

test('voucher codes use a readable tier prefix and ten unambiguous random characters', () => {
  const bytes = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  assert.equal(JOY_CODE_ALPHABET, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
  assert.equal(createJoyVoucherCode('rm1', bytes), 'JOY-RM1-ABCDEFGHJK');
  assert.equal(createJoyVoucherCode('rm2', bytes), 'JOY-RM2-ABCDEFGHJK');
  assert.equal(createJoyVoucherCode('rm5', bytes), 'JOY-RM5-ABCDEFGHJK');
});

test('voucher code validation is case-insensitive but rejects ambiguous or malformed codes', () => {
  assert.equal(isJoyVoucherCode('joy-rm1-abcdefghjk'), true);
  assert.equal(isJoyVoucherCode('JOY-RM5-23456789AB'), true);
  assert.equal(isJoyVoucherCode('JOY-RM5-10OILABCDE'), false);
  assert.equal(isJoyVoucherCode('JOY-RM3-ABCDEFGHJK'), false);
  assert.equal(isJoyVoucherCode('JOY-RM1-ABC'), false);
});

test('voucher generation rejects unsupported tiers and incomplete entropy', () => {
  assert.throws(() => createJoyVoucherCode('rm3', new Uint8Array(10)), {
    code: 'invalid-argument',
  });
  assert.throws(() => createJoyVoucherCode('rm1', new Uint8Array(9)), {
    code: 'invalid-argument',
  });
});
