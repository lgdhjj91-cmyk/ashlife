import { getGiftRushDailyChallenge, evaluateGiftRushChallenge } from '../data/dailyChallenges.js';

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const integer = value => ['number', 'string'].includes(typeof value) && Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const uid = value => typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null;
const owners = value => Array.isArray(value) ? [...new Set(value.filter(value => uid(value)))] : [];
export const giftRushClaimId = date => 'gift-rush-daily:' + date;
// Local storage separates owners; Firestore receives the same fixed date ID per wallet.
export const giftRushClaimKey = (date, ownerUid) => giftRushClaimId(date) + (uid(ownerUid) ? ':' + encodeURIComponent(ownerUid) : '');
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
    }]));
  const pendingRewardClaims = Object.fromEntries(Object.entries(record(source.pendingRewardClaims))
    .filter(([key, claim]) => validDate(claim?.dateKey) && claim.amount === 20 &&
      [giftRushClaimId(claim.dateKey), giftRushClaimKey(claim.dateKey, claim.ownerUid)].includes(key))
    .map(([, claim]) => [giftRushClaimKey(claim.dateKey, claim.ownerUid), { dateKey: claim.dateKey, amount: 20, ownerUid: uid(claim.ownerUid) }]));
  return {
    tutorialCompleted: Boolean(source.tutorialCompleted), selectedMode: ['practice', 'daily'].includes(source.selectedMode) ? source.selectedMode : 'practice',
    bestScore: integer(source.bestScore), bestCombo: integer(source.bestCombo), totalOrdersServed: integer(source.totalOrdersServed),
    lastCompletedSessionId: typeof source.lastCompletedSessionId === 'string' ? source.lastCompletedSessionId : '', dailyByDate, pendingRewardClaims,
  };
};
export const getGiftRushRewardStatus = (giftRush, dateKey, ownerUid) => {
  const daily = giftRush.dailyByDate[dateKey];
  if (uid(ownerUid) && daily?.claimedOwnerUids?.includes(ownerUid)) return 'credited';
  if (giftRush.pendingRewardClaims[giftRushClaimKey(dateKey, ownerUid)] || giftRush.pendingRewardClaims[giftRushClaimKey(dateKey, null)]) return 'pending';
  if (uid(ownerUid) && daily?.completedOwnerUids?.includes(ownerUid)) return 'pending';
  return 'incomplete';
};
export const prepareGiftRushClaim = (progress, { dateKey, ownerUid }) => {
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  const owner = uid(ownerUid);
  const daily = giftRush.dailyByDate[dateKey];
  const claimId = giftRushClaimId(dateKey);
  const key = giftRushClaimKey(dateKey, owner);
  const unboundKey = giftRushClaimKey(dateKey, null);
  const existing = giftRush.pendingRewardClaims[key] || giftRush.pendingRewardClaims[unboundKey];
  if (!validDate(dateKey) || (owner && daily?.claimedOwnerUids.includes(owner)) ||
      (!existing && !(owner && daily?.completedOwnerUids.includes(owner)))) return { nextProgress: progress, claimId: null };
  const pendingRewardClaims = { ...giftRush.pendingRewardClaims };
  if (owner && existing?.ownerUid === null) delete pendingRewardClaims[unboundKey];
  pendingRewardClaims[key] = { dateKey, amount: 20, ownerUid: owner };
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
  const previous = giftRush.dailyByDate[result.dateKey] || { completed: false, bestScore: 0, completedOwnerUids: [], claimedOwnerUids: [] };
  nextProgress.giftRush.dailyByDate = { ...giftRush.dailyByDate, [result.dateKey]: {
    ...previous, challengeId: challenge.id, completed: previous.completed || qualified,
    completedOwnerUids: owner && qualified ? [...new Set([...previous.completedOwnerUids, owner])] : previous.completedOwnerUids,
    bestScore: Math.max(previous.bestScore, integer(stats.score)),
  } };
  // Previously unbound rewards only bind through the explicit Claim action.
  if (!qualified || giftRush.pendingRewardClaims[giftRushClaimKey(result.dateKey, null)]) return { nextProgress, stickerIds, claimId: null };
  if (!owner) {
    nextProgress.giftRush.pendingRewardClaims = { ...giftRush.pendingRewardClaims,
      [giftRushClaimKey(result.dateKey, null)]: { dateKey: result.dateKey, amount: 20, ownerUid: null } };
    return { nextProgress, stickerIds, claimId: giftRushClaimId(result.dateKey) };
  }
  return { ...prepareGiftRushClaim(nextProgress, { dateKey: result.dateKey, ownerUid: owner }), stickerIds };
};
export const confirmGiftRushClaim = (progress, { claimId, ownerUid }) => {
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  const dateKey = claimId?.slice('gift-rush-daily:'.length);
  const key = giftRushClaimKey(dateKey, ownerUid);
  const claim = giftRush.pendingRewardClaims[key];
  if (!claim?.ownerUid || claim.ownerUid !== ownerUid || claimId !== giftRushClaimId(claim.dateKey)) return progress;
  const pendingRewardClaims = { ...giftRush.pendingRewardClaims };
  delete pendingRewardClaims[key];
  const daily = giftRush.dailyByDate[claim.dateKey];
  return { ...progress, giftRush: { ...giftRush, pendingRewardClaims,
    dailyByDate: { ...giftRush.dailyByDate, [claim.dateKey]: {
      ...daily, challengeId: getGiftRushDailyChallenge(claim.dateKey).id, completed: true, bestScore: daily?.bestScore || 0,
      completedOwnerUids: [...new Set([...(daily?.completedOwnerUids || []), ownerUid])],
      claimedOwnerUids: [...new Set([...(daily?.claimedOwnerUids || []), ownerUid])],
    } },
  } };
};
