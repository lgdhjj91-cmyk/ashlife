import React from 'react';
import { Coins, Gift, Sparkles } from 'lucide-react';
import { summarizeSession } from '../systems/SessionFlow';

const SessionCard = ({ mode, entries }) => {
  const session = summarizeSession(entries);
  const recentEntries = entries.slice(-5);
  const hiddenCount = Math.max(0, entries.length - recentEntries.length);

  return (
    <section className="claw-session-card" aria-label="Won prizes this session">
      <div className="claw-session-heading">
        <div>
          <span className="claw-session-kicker">This session</span>
          <h2>Won Prizes</h2>
        </div>
        <span className="claw-session-mode">{mode === 'classic' ? 'Classic' : 'Practice'}</span>
      </div>
      <div className="claw-session-stats">
        <span>
          <Gift size={17} />
          <strong>{session.prizeCount}</strong>
          dolls won
        </span>
        <span>
          <Coins size={17} />
          <strong>{session.totalCoins}</strong>
          session coins
        </span>
      </div>
      {recentEntries.length ? (
        <div className="claw-session-prizes">
          {recentEntries.map((entry, index) => (
            <span className="claw-session-prize" key={`${entry.prize.id}-${index}`}>
              <img src={entry.prize.image} alt={entry.prize.name} />
            </span>
          ))}
          {hiddenCount > 0 && <span className="claw-session-overflow">+{hiddenCount}</span>}
        </div>
      ) : (
        <p className="claw-session-empty">
          <Sparkles size={16} />
          Prizes collected through the chute will appear here.
        </p>
      )}
    </section>
  );
};

export default SessionCard;
