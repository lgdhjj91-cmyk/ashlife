export const awardJoyCoinsForCurrentUser = (auth, repository, amount, claimId, expectedOwnerUid = null) => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) throw new Error('Guest session is still loading.');
  if (expectedOwnerUid && currentUid !== expectedOwnerUid) throw new Error('This reward belongs to a different wallet. Return to that account to retry.');
  return repository.awardJoyCoins(currentUid, amount, claimId);
};
