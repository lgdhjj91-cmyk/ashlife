import React from 'react';
import { Coins, Gift, Trophy } from 'lucide-react';

const SessionSummaryModal = ({ summary, onPlayPractice, onBackToPlayroom }) => {
  if (!summary) return null;

  return (
    <div className="claw-overlay-backdrop" role="dialog" aria-modal="true" aria-label="Classic session summary">
      <section className="claw-overlay-panel claw-summary-panel">
        <span className="playroom-pill">Classic Complete!</span>
        <h2>Your Prize Haul</h2>
        <p className="claw-summary-lead">
          {summary.prizeCount
            ? `You clawed ${summary.prizeCount} ${summary.prizeCount === 1 ? 'doll' : 'dolls'} today!`
            : 'No dolls this time, but the machine will be ready again tomorrow.'}
        </p>

        <div className="claw-summary-totals">
          <span>
            <Gift size={20} />
            <strong>{summary.prizeCount}</strong>
            dolls
          </span>
          <span>
            <Coins size={20} />
            <strong>{summary.totalCoins}</strong>
            Joy Coins
          </span>
          <span>
            <Trophy size={20} />
            <strong>{summary.attemptsUsed}</strong>
            tries used
          </span>
        </div>

        {summary.entries.length > 0 && (
          <div className="claw-summary-grid" aria-label="Collected prizes">
            {summary.entries.map((entry, index) => (
              <article key={`${entry.prize.id}-${index}`}>
                <img src={entry.prize.image} alt={entry.prize.name} />
                <strong>{entry.prize.name}</strong>
                <span>+{entry.reward.coins} coins</span>
              </article>
            ))}
          </div>
        )}

        <p className="claw-summary-daily-note">
          Classic refreshes tomorrow. Practice mode is always available.
        </p>
        <div className="completion-actions">
          <button className="playroom-button primary" type="button" onClick={onPlayPractice}>
            Play Practice
          </button>
          <button className="playroom-button secondary" type="button" onClick={onBackToPlayroom}>
            Back to Playroom
          </button>
        </div>
      </section>
    </div>
  );
};

export default SessionSummaryModal;
