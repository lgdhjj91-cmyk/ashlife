import { getGiftRushDailyChallenge, evaluateGiftRushChallenge } from '../data/dailyChallenges.js';
import { giftRushRewards, getGiftRushReward, giftRushRewardId } from '../data/rewards.js';

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const integer = value => ['number', 'string'].includes(typeof value) && Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const uid = value => typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null;
const owners = value => Array.isArray(value) ? [...new Set(value.filter(value => uid(value)))] : [];
export const giftRushClaimId = giftRushRewardId;
// Local storage separates owners; Firestore receives the same fixed date ID per wallet.
export const giftRushClaimKey = (date, ownerUid, rewardId = 'daily') => giftRushClaimId(date, rewardId) + (uid(ownerUid) ? ':' + encodeURIComponent(ownerUid) : '');
const rewardRecord = (daily, rewardId) => rewardId === 'daily' ? daily : daily?.scoreBonuses?.[rewardId];
const emptyOwners = () => ({ completedOwnerUids: [], claimedOwnerUids: [] });
const normalizeBonuses = value => Object.fromEntries(giftRushRewards.filter(reward => reward.threshold).map(reward => [reward.id, {
  completedOwnerUids: owners(value?.[reward.id]?.completedOwnerUids), claimedOwnerUids: owners(value?.[reward.id]?.claimedOwnerUids),
}]));
const pendingClaim = (dateKey, ownerUid, rewardId) => ({ dateKey, amount: getGiftRushReward(rewardId).amount, ownerUid,
  ...(rewardId === 'daily' ? {} : { rewardId }),
});
export const defaultGiftRushProgress = {
  tutorialCompleted: false, selectedMode: 'practice', bestScore: 0, bestCombo: 0,
  totalOrdersServed: 0, lastCompletedSessionId: '', dailyByDate: {}, pendingRewardClaims: {},
};
export const normalizeGiftRushProgress = value => {
  const source = record(value);
  const dailyByDate = Object.fromEntries(Object.entries(record(source.dailyByDate))
    .filter(([date]) => validDate(date)).sort(([a], [b]) => b.localeCompare(a)).slice(0, 30)
    .map(([date, daily]) => [date, {
      challengeId: getGiftRushDailyChallenge(date).id, completed: Boolean(daily?.completed), bestScore: integer(daily?.bestScore),
      completedOwnerUids: owners(daily?.completedOwnerUids), claimedOwnerUids: owners(daily?.claimedOwnerUids),
      scoreBonuses: normalizeBonuses(daily?.scoreBonuses),
    }]));
  const pendingRewardClaims = Object.fromEntries(Object.entries(record(source.pendingRewardClaims))
    .filter(([key, claim]) => validDate(claim?.dateKey) && getGiftRushReward(claim.rewardId)?.amount === claim.amount &&
      [giftRushClaimId(claim.dateKey, claim.rewardId), giftRushClaimKey(claim.dateKey, claim.ownerUid, claim.rewardId)].includes(key))
    .map(([, claim]) => [giftRushClaimKey(claim.dateKey, claim.ownerUid, claim.rewardId), pendingClaim(claim.dateKey, uid(claim.ownerUid), claim.rewardId || 'daily')]));
  return {
    tutorialCompleted: Boolean(source.tutorialCompleted), selectedMode: ['practice', 'daily'].includes(source.selectedMode) ? source.selectedMode : 'practice',
    bestScore: integer(source.bestScore), bestCombo: integer(source.bestCombo), totalOrdersServed: integer(source.totalOrdersServed),
    lastCompletedSessionId: typeof source.lastCompletedSessionId === 'string' ? source.lastCompletedSessionId : '', dailyByDate, pendingRewardClaims,
  };
};
export const getGiftRushRewardStatus = (giftRush, dateKey, ownerUid, rewardId = 'daily') => {
  const daily = rewardRecord(giftRush.dailyByDate[dateKey], rewardId);
  if (uid(ownerUid) && daily?.claimedOwnerUids?.includes(ownerUid)) return 'credited';
  if (giftRush.pendingRewardClaims[giftRushClaimKey(dateKey, ownerUid, rewardId)] || giftRush.pendingRewardClaims[giftRushClaimKey(dateKey, null, rewardId)]) return 'pending';
  if (uid(ownerUid) && daily?.completedOwnerUids?.includes(ownerUid)) return 'pending';
  return 'incomplete';
};
export const prepareGiftRushClaim = (progress, { dateKey, ownerUid, rewardId = 'daily' }) => {
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  const owner = uid(ownerUid);
  const daily = rewardRecord(giftRush.dailyByDate[dateKey], rewardId);
  const claimId = giftRushClaimId(dateKey, rewardId);
  const key = giftRushClaimKey(dateKey, owner, rewardId);
  const unboundKey = giftRushClaimKey(dateKey, null, rewardId);
  const existing = giftRush.pendingRewardClaims[key] || giftRush.pendingRewardClaims[unboundKey];
  if (!getGiftRushReward(rewardId) || !validDate(dateKey) || (owner && daily?.claimedOwnerUids.includes(owner)) ||
      (!existing && !(owner && daily?.completedOwnerUids.includes(owner)))) return { nextProgress: progress, claimId: null };
  const pendingRewardClaims = { ...giftRush.pendingRewardClaims };
  if (owner && existing?.ownerUid === null) delete pendingRewardClaims[unboundKey];
  pendingRewardClaims[key] = pendingClaim(dateKey, owner, rewardId);
  return { nextProgress: { ...progress, giftRush: { ...giftRush, pendingRewardClaims } }, claimId };
};
export const applyGiftRushResult = (progress, result, { ownerUid }) => {
  if (!result?.sessionId || !validDate(result.dateKey)) return { nextProgress: progress, stickerIds: [], claimId: null };
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  if (giftRush.lastCompletedSessionId === result.sessionId) return { nextProgress: progress, stickerIds: [], claimId: null };
  const stats = result.stats || {};
  let nextProgress = { ...progress, giftRush: {
    ...giftRush, lastCompletedSessionId: result.sessionId, bestScore: Math.max(giftRush.bestScore, integer(stats.score)),
    bestCombo: Math.max(giftRush.bestCombo, integer(stats.maxCombo)), totalOrdersServed: giftRush.totalOrdersServed + integer(stats.servedOrders),
  } };
  const stickerIds = [];
  if (integer(stats.perfectOrders) >= 5 && !(progress.unlockedStickers || []).includes('gift-rush-happy-parcel')) {
    stickerIds.push('gift-rush-happy-parcel');
    nextProgress = { ...nextProgress, unlockedStickers: [...(progress.unlockedStickers || []), 'gift-rush-happy-parcel'],
      stickerUnlockDates: { ...progress.stickerUnlockDates, 'gift-rush-happy-parcel': result.dateKey } };
  }
  if (result.mode !== 'daily') return { nextProgress, stickerIds, claimId: null };
  const challenge = getGiftRushDailyChallenge(result.dateKey);
  const qualified = evaluateGiftRushChallenge(challenge, stats).complete;
  const owner = uid(ownerUid);
  const previous = giftRush.dailyByDate[result.dateKey] || { completed: false, bestScore: 0, ...emptyOwners(), scoreBonuses: normalizeBonuses() };
  nextProgress.giftRush.dailyByDate = { ...giftRush.dailyByDate, [result.dateKey]: {
    ...previous, challengeId: challenge.id, completed: previous.completed || qualified,
    completedOwnerUids: owner && qualified ? [...new Set([...previous.completedOwnerUids, owner])] : previous.completedOwnerUids,
    bestScore: Math.max(previous.bestScore, integer(stats.score)),
  } };
  let claimId = null;
  for (const reward of giftRushRewards) {
    const earned = reward.id === 'daily' ? qualified : integer(stats.score) >= reward.threshold;
    if (!earned) continue;
    if (reward.id !== 'daily' && owner) {
      const daily = nextProgress.giftRush.dailyByDate[result.dateKey];
      const bonus = daily.scoreBonuses[reward.id];
      daily.scoreBonuses = { ...daily.scoreBonuses, [reward.id]: { ...bonus,
        completedOwnerUids: [...new Set([...bonus.completedOwnerUids, owner])],
      } };
    }
    // Previously unbound rewards only bind through the explicit Claim action.
    if (giftRush.pendingRewardClaims[giftRushClaimKey(result.dateKey, null, reward.id)]) continue;
    if (!owner) {
      nextProgress.giftRush.pendingRewardClaims = { ...nextProgress.giftRush.pendingRewardClaims,
        [giftRushClaimKey(result.dateKey, null, reward.id)]: pendingClaim(result.dateKey, null, reward.id) };
      if (reward.id === 'daily') claimId = giftRushClaimId(result.dateKey);
    } else {
      const prepared = prepareGiftRushClaim(nextProgress, { dateKey: result.dateKey, ownerUid: owner, rewardId: reward.id });
      nextProgress = prepared.nextProgress;
      if (reward.id === 'daily') claimId = prepared.claimId;
    }
  }
  return { nextProgress, stickerIds, claimId };
};
export const confirmGiftRushClaim = (progress, { claimId, ownerUid }) => {
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  const entry = Object.entries(giftRush.pendingRewardClaims).find(([, claim]) => claim.ownerUid === ownerUid && claimId === giftRushClaimId(claim.dateKey, claim.rewardId));
  if (!entry || !uid(ownerUid)) return progress;
  const [key, claim] = entry;
  const rewardId = claim.rewardId || 'daily';
  const pendingRewardClaims = { ...giftRush.pendingRewardClaims };
  delete pendingRewardClaims[key];
  const daily = giftRush.dailyByDate[claim.dateKey] || { completed: false, bestScore: 0, ...emptyOwners(), scoreBonuses: normalizeBonuses() };
  const previous = rewardRecord(daily, rewardId);
  const confirmed = {
    completedOwnerUids: [...new Set([...previous.completedOwnerUids, ownerUid])],
    claimedOwnerUids: [...new Set([...previous.claimedOwnerUids, ownerUid])],
  };
  return { ...progress, giftRush: { ...giftRush, pendingRewardClaims,
    dailyByDate: { ...giftRush.dailyByDate, [claim.dateKey]: {
      ...daily, challengeId: getGiftRushDailyChallenge(claim.dateKey).id,
      ...(rewardId === 'daily' ? { completed: true, ...confirmed } : { scoreBonuses: { ...daily.scoreBonuses, [rewardId]: confirmed } }),
    } },
  } };
};
