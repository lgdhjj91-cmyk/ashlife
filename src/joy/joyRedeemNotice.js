const createError = (code, message) => Object.assign(new Error(message), { code });

const formatWholeRm = (sen) => `RM${(Number(sen) / 100).toFixed(0)}`;

export const createRedeemedVoucherNotice = (voucher) => {
  const code = String(voucher?.code || '').trim();
  const valueSen = Number(voucher?.valueSen);
  const minSubtotalSen = Number(voucher?.minSubtotalSen);
  if (!code || !Number.isFinite(valueSen) || !Number.isFinite(minSubtotalSen)) {
    throw createError('invalid-argument', 'Complete voucher details are required.');
  }

  return {
    code,
    discountLabel: formatWholeRm(valueSen),
    minimumLabel: formatWholeRm(minSubtotalSen),
  };
};
