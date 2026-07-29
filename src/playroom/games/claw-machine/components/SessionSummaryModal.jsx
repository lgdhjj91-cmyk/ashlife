import React from 'react';
import { Coins, Gift, Trophy } from 'lucide-react';

const SessionSummaryModal = ({ summary, onPlayPractice, onBackToPlayroom, copy, prizeNames }) => {
  if (!summary) return null;

  return (
    <div className="claw-overlay-backdrop" role="dialog" aria-modal="true" aria-label={copy.aria}>
      <section className="claw-overlay-panel claw-summary-panel">
        <span className="playroom-pill">{copy.complete}</span>
        <h2>{copy.title}</h2>
        <p className="claw-summary-lead">
          {copy.lead(summary.prizeCount)}
        </p>

        <div className="claw-summary-totals">
          <span>
            <Gift size={20} />
            <strong>{summary.prizeCount}</strong>
            {copy.dolls}
          </span>
          <span>
            <Coins size={20} />
            <strong>{summary.totalCoins}</strong>
            {copy.joyCoins}
          </span>
          <span>
            <Trophy size={20} />
            <strong>{summary.attemptsUsed}</strong>
            {copy.triesUsed}
          </span>
        </div>

        {summary.entries.length > 0 && (
          <div className="claw-summary-grid" aria-label={copy.collectedAria}>
            {summary.entries.map((entry, index) => (
              <article key={`${entry.prize.id}-${index}`}>
                <img src={entry.prize.image} alt={prizeNames[entry.prize.id] || entry.prize.name} />
                <strong>{prizeNames[entry.prize.id] || entry.prize.name}</strong>
                <span>+{entry.reward.coins} {copy.coins}</span>
              </article>
            ))}
          </div>
        )}

        <p className="claw-summary-daily-note">
          {copy.dailyNote}
        </p>
        <div className="completion-actions">
          <button className="playroom-button primary" type="button" onClick={onPlayPractice}>
            {copy.practice}
          </button>
          <button className="playroom-button secondary" type="button" onClick={onBackToPlayroom}>
            {copy.back}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SessionSummaryModal;
