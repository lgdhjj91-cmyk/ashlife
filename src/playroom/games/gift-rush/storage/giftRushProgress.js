import { getGiftRushDailyChallenge, evaluateGiftRushChallenge } from '../data/dailyChallenges.js';

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const integer = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const uid = value => typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null;
export const defaultGiftRushProgress = {
  tutorialCompleted: false, selectedMode: 'practice', bestScore: 0, bestCombo: 0,
  totalOrdersServed: 0, lastCompletedSessionId: '', dailyByDate: {}, pendingRewardClaims: {},
};
export const normalizeGiftRushProgress = value => {
  const source = record(value);
  const dailyByDate = Object.fromEntries(Object.entries(record(source.dailyByDate))
    .filter(([date]) => validDate(date)).sort(([a], [b]) => b.localeCompare(a)).slice(0, 30)
    .map(([date, daily]) => [date, {
      challengeId: getGiftRushDailyChallenge(date).id, completed: Boolean(daily?.completed),
      bestScore: integer(daily?.bestScore), coinsClaimed: daily?.coinsClaimed === 20 ? 20 : 0,
    }]));
  const pendingRewardClaims = Object.fromEntries(Object.entries(record(source.pendingRewardClaims))
    .filter(([id, claim]) => validDate(claim?.dateKey) && id === 'gift-rush-daily:' + claim.dateKey && claim.amount === 20)
    .map(([id, claim]) => [id, { dateKey: claim.dateKey, amount: 20, ownerUid: uid(claim.ownerUid) }]));
  return {
    tutorialCompleted: Boolean(source.tutorialCompleted),
    selectedMode: ['practice', 'daily'].includes(source.selectedMode) ? source.selectedMode : 'practice',
    bestScore: integer(source.bestScore), bestCombo: integer(source.bestCombo),
    totalOrdersServed: integer(source.totalOrdersServed),
    lastCompletedSessionId: typeof source.lastCompletedSessionId === 'string' ? source.lastCompletedSessionId : '',
    dailyByDate, pendingRewardClaims,
  };
};
export const prepareGiftRushClaim = (progress, { dateKey, ownerUid }) => {
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  const daily = giftRush.dailyByDate[dateKey];
  const claimId = 'gift-rush-daily:' + dateKey;
  const existing = giftRush.pendingRewardClaims[claimId];
  if (!daily?.completed || daily.coinsClaimed === 20 || (existing?.ownerUid && existing.ownerUid !== ownerUid)) {
    return { nextProgress: progress, claimId: null };
  }
  const claim = { dateKey, amount: 20, ownerUid: uid(ownerUid) };
  return { nextProgress: { ...progress, giftRush: {
    ...giftRush, pendingRewardClaims: { ...giftRush.pendingRewardClaims, [claimId]: claim },
  } }, claimId };
};
export const applyGiftRushResult = (progress, result, { ownerUid }) => {
  if (!result?.sessionId || !validDate(result.dateKey)) return { nextProgress: progress, stickerIds: [], claimId: null };
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  if (giftRush.lastCompletedSessionId === result.sessionId) return { nextProgress: progress, stickerIds: [], claimId: null };
  const stats = result.stats || {};
  let nextProgress = { ...progress, giftRush: {
    ...giftRush, lastCompletedSessionId: result.sessionId,
    bestScore: Math.max(giftRush.bestScore, integer(stats.score)),
    bestCombo: Math.max(giftRush.bestCombo, integer(stats.maxCombo)),
    totalOrdersServed: giftRush.totalOrdersServed + integer(stats.servedOrders),
  } };
  const stickerIds = [];
  if (integer(stats.perfectOrders) >= 5 && !(progress.unlockedStickers || []).includes('gift-rush-happy-parcel')) {
    stickerIds.push('gift-rush-happy-parcel');
    nextProgress = { ...nextProgress,
      unlockedStickers: [...(progress.unlockedStickers || []), 'gift-rush-happy-parcel'],
      stickerUnlockDates: { ...progress.stickerUnlockDates, 'gift-rush-happy-parcel': result.dateKey },
    };
  }
  if (result.mode !== 'daily') return { nextProgress, stickerIds, claimId: null };
  const challenge = getGiftRushDailyChallenge(result.dateKey);
  const previous = giftRush.dailyByDate[result.dateKey] || { completed: false, bestScore: 0, coinsClaimed: 0 };
  nextProgress.giftRush.dailyByDate = { ...giftRush.dailyByDate, [result.dateKey]: {
    ...previous, challengeId: challenge.id,
    completed: previous.completed || evaluateGiftRushChallenge(challenge, stats).complete,
    bestScore: Math.max(previous.bestScore, integer(stats.score)),
  } };
  return { ...prepareGiftRushClaim(nextProgress, { dateKey: result.dateKey, ownerUid }), stickerIds };
};
export const confirmGiftRushClaim = (progress, { claimId, ownerUid }) => {
  const giftRush = normalizeGiftRushProgress(progress.giftRush);
  const claim = giftRush.pendingRewardClaims[claimId];
  if (!claim?.ownerUid || claim.ownerUid !== ownerUid) return progress;
  const pendingRewardClaims = { ...giftRush.pendingRewardClaims };
  delete pendingRewardClaims[claimId];
  return { ...progress, giftRush: { ...giftRush, pendingRewardClaims,
    dailyByDate: { ...giftRush.dailyByDate, [claim.dateKey]: {
      ...giftRush.dailyByDate[claim.dateKey], challengeId: getGiftRushDailyChallenge(claim.dateKey).id,
      completed: true, bestScore: giftRush.dailyByDate[claim.dateKey]?.bestScore || 0, coinsClaimed: 20,
    } },
  } };
};
