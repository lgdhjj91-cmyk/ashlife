import { getMergeTier } from '../data/mergeTiers.js';

export const COMBO_WINDOW_MS = 1_800;
export const PERFECT_DROP_WINDOW_MS = 1_400;
const COMBO_MULTIPLIERS = [1, 1.5, 2.25, 3.5];

export const getComboCount = ({ previousCount = 0, previousMergeAt = 0, now }) =>
  previousMergeAt && now - previousMergeAt <= COMBO_WINDOW_MS ? previousCount + 1 : 1;

export const calculateMergeAward = ({ sourceTier, comboCount = 1, perfectDrop = false }) => {
  const base = getMergeTier(sourceTier)?.score || 0;
  const multiplier = COMBO_MULTIPLIERS[Math.min(Math.max(1, comboCount), COMBO_MULTIPLIERS.length) - 1];
  const comboBonus = Math.round(base * multiplier) - base;
  const perfectBonus = perfectDrop ? 100 : 0;
  return { base, comboBonus, perfectBonus, total: base + comboBonus + perfectBonus };
};
