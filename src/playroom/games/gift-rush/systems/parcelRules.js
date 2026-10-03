export const validateParcel = (order, tray) => {
  const expected = [...(order?.items || [])].sort();
  const actual = [...(tray?.items || [])].sort();
  if (expected.length !== actual.length || expected.some((id, index) => actual[index] !== id)) return { valid: false, reason: 'items' };
  if (order.wrapId !== tray?.wrapId) return { valid: false, reason: 'wrap' };
  return { valid: true, reason: null };
};
export const calculateDeliveryScore = ({ remainingPatienceMs, initialPatienceMs, priorCombo, perfect }) => {
  const bonus = Math.floor(50 * Math.max(0, Math.min(1, remainingPatienceMs / Math.max(1, initialPatienceMs))));
  const combo = perfect ? priorCombo + 1 : 0;
  const multiplier = perfect ? Math.min(3, 1 + 0.25 * (combo - 1)) : 1;
  return { points: Math.floor((100 + bonus) * multiplier), combo, multiplier };
};
