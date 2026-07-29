import React from 'react';
import { Coins, Gift, Sparkles } from 'lucide-react';
import { summarizeSession } from '../systems/SessionFlow';

const SessionCard = ({ mode, entries, copy, prizeNames }) => {
  const session = summarizeSession(entries);
  const recentEntries = entries.slice(-5);
  const hiddenCount = Math.max(0, entries.length - recentEntries.length);

  return (
    <section className="claw-session-card" aria-label={copy.aria}>
      <div className="claw-session-heading">
        <div>
          <span className="claw-session-kicker">{copy.thisSession}</span>
          <h2>{copy.wonPrizes}</h2>
        </div>
        <span className="claw-session-mode">{mode === 'classic' ? copy.classic : copy.practice}</span>
      </div>
      <div className="claw-session-stats">
        <span>
          <Gift size={17} />
          <strong>{session.prizeCount}</strong>
          {copy.dollsWon}
        </span>
        <span>
          <Coins size={17} />
          <strong>{session.totalCoins}</strong>
          {copy.sessionCoins}
        </span>
      </div>
      {recentEntries.length ? (
        <div className="claw-session-prizes">
          {recentEntries.map((entry, index) => (
            <span className="claw-session-prize" key={`${entry.prize.id}-${index}`}>
              <img src={entry.prize.image} alt={prizeNames[entry.prize.id] || entry.prize.name} />
            </span>
          ))}
          {hiddenCount > 0 && <span className="claw-session-overflow">+{hiddenCount}</span>}
        </div>
      ) : (
        <p className="claw-session-empty">
          <Sparkles size={16} />
          {copy.empty}
        </p>
      )}
    </section>
  );
};

export default SessionCard;
