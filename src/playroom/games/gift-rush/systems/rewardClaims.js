export const createGiftRushClaimRunner = ({ awardCoins, getCurrentUid }) => {
  const inFlight = new Map();
  return {
    attempt(claimId, claim) {
      const base = { claimId, ownerUid: claim?.ownerUid };
      if (!claim?.ownerUid) return Promise.resolve({ ...base, status: 'unbound' });
      if (claim.ownerUid !== getCurrentUid()) return Promise.resolve({ ...base, status: 'wallet-changed' });
      if (claim.amount !== 20 || claimId !== 'gift-rush-daily:' + claim.dateKey) return Promise.resolve({ ...base, status: 'pending', error: 'Invalid reward claim.' });
      const key = claim.ownerUid + ':' + claimId;
      if (inFlight.has(key)) return inFlight.get(key);
      const attempt = Promise.resolve().then(async () => {
        try {
          if (getCurrentUid() !== claim.ownerUid) return { ...base, status: 'wallet-changed' };
          const result = await awardCoins(20, claimId);
          if (getCurrentUid() !== claim.ownerUid) return { ...base, status: 'wallet-changed' };
          return result?.success
            ? { ...base, status: 'credited' }
            : { ...base, status: 'pending', error: result?.error || 'Reward pending.' };
        } catch (error) {
          return { ...base, status: 'pending', error: error?.message || 'Reward pending.' };
        } finally {
          inFlight.delete(key);
        }
      });
      inFlight.set(key, attempt);
      return attempt;
    },
  };
};
