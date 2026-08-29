import { JOY_VOUCHER_TIERS } from './joyVoucherRules.js';

export const JOY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const createError = (code, message) => Object.assign(new Error(message), { code });

const tierPrefix = (tierId) => {
  const tier = JOY_VOUCHER_TIERS.find((candidate) => candidate.id === tierId);
  if (!tier) throw createError('invalid-argument', 'Unknown Joy voucher tier.');
  return `JOY-RM${tier.valueSen / 100}`;
};

export const createJoyVoucherCode = (tierId, randomBytes) => {
  const bytes = randomBytes || globalThis.crypto?.getRandomValues(new Uint8Array(10));
  if (!(bytes instanceof Uint8Array) || bytes.length !== 10) {
    throw createError('invalid-argument', 'Ten random bytes are required for a Joy voucher code.');
  }

  const suffix = Array.from(bytes, (byte) => JOY_CODE_ALPHABET[byte & 31]).join('');
  return `${tierPrefix(tierId)}-${suffix}`;
};

export const isJoyVoucherCode = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  return /^JOY-RM(?:1|2|5)-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/.test(normalized);
};
