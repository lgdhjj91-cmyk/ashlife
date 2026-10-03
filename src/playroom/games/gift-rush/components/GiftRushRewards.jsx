import React from 'react';
import { giftRushRewards } from '../data/rewards.js';
import { getGiftRushRewardStatus, giftRushClaimId } from '../storage/giftRushProgress.js';

const GiftRushRewards = ({ giftRush, dateKey, ownerUid, copy, claimDisabled, onClaim }) => {
  const rewards = giftRushRewards.map(reward => ({ ...reward, status: getGiftRushRewardStatus(giftRush, dateKey, ownerUid, reward.id) }));
  const credited = rewards.filter(reward => reward.status === 'credited').reduce((sum, reward) => sum + reward.amount, 0);
  return <section className="gift-reward-breakdown" aria-label={copy.dailyRewards}>
    <strong>{copy.dailyRewards}</strong>
    <ul>{rewards.map(reward => <li key={reward.id} data-reward={reward.id}>
      <span>{reward.threshold ? reward.threshold.toLocaleString() + ' ' + copy.score : copy.goalReward}<b>+{reward.amount} {copy.coins}</b></span>
      <span className={'gift-reward-status ' + reward.status}>{copy.rewardStatuses[reward.status]}</span>
      {reward.status === 'pending' ? <button type="button" className="gift-secondary" disabled={claimDisabled} onClick={() => onClaim(dateKey, reward.id)}>
        {giftRush.pendingRewardClaims[giftRushClaimId(dateKey, reward.id)] ? copy.claim : copy.retry}
      </button> : null}
    </li>)}</ul>
    <p role="status">{copy.coinsClaimedToday}: <strong>{credited} / 30</strong> {copy.coins}</p>
    <small>{copy.bonusReplay}</small>
    {claimDisabled && rewards.some(reward => reward.status === 'pending') ? <small>{copy.walletWait}</small> : null}
  </section>;
};
export default GiftRushRewards;
