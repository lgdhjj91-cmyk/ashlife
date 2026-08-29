import { MAX_MERGE_TIER } from '../data/mergeTiers.js';

export const canMerge = (first, second) =>
  Boolean(
    first &&
      second &&
      first.id !== second.id &&
      !first.merging &&
      !second.merging &&
      first.tier === second.tier &&
      first.tier < MAX_MERGE_TIER
  );

export const getMergePairKey = (firstId, secondId) => [String(firstId), String(secondId)].sort((a, b) => Number(a) - Number(b)).join(':');

export const lockMergePair = (locks, first, second) => {
  const key = getMergePairKey(first.id, second.id);
  if (locks.has(key)) return null;
  locks.add(key);
  return key;
};
