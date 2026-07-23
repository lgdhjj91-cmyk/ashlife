import React from 'react';
import { CalendarHeart, CheckCircle2, Coins } from 'lucide-react';

const DailyChallengeCard = ({ challenge, progress, labels }) => {
  const isClaimed = progress.dailyChallenge.lastClaimedDate === challenge.dateKey;
  const text = labels.daily;

  return (
    <article className="daily-challenge-card">
      <div className="daily-challenge-icon">
        <CalendarHeart size={24} />
      </div>
      <div>
        <span className="playroom-pill">{text.pill}</span>
        <h3>{labels.challengeTitles[challenge.id] || challenge.title}</h3>
        <p>
          <Coins size={16} />
          {text.reward
            .replace('{coins}', challenge.rewardCoins)
            .replace('{rarity}', labels.rarity[challenge.rewardRarity] || challenge.rewardRarity)}
        </p>
      </div>
      <span className={`daily-status ${isClaimed ? 'complete' : ''}`}>
        {isClaimed ? <CheckCircle2 size={16} /> : null}
        {isClaimed ? text.claimed : text.ready}
      </span>
    </article>
  );
};

export default DailyChallengeCard;
