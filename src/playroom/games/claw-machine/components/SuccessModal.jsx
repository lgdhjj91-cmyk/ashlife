import React from 'react';
import { Coins, Sparkles } from 'lucide-react';

const SuccessModal = ({ result, onPlayAgain, onBackToPlayroom }) => {
  if (!result) return null;

  return (
    <div className="claw-overlay-backdrop" role="dialog" aria-modal="true" aria-label="Prize won">
      <section className="claw-overlay-panel claw-success-panel">
        <span className="playroom-pill">Yay! You Won!</span>
        <img src={result.prize.image} alt={result.prize.name} />
        <h2>{result.prize.name}</h2>
        <div className="claw-success-rewards">
          <span>
            <Coins size={20} />
            +{result.reward.coins} Joy Coins
          </span>
          <span>
            <Sparkles size={20} />
            {result.reward.isDuplicate ? 'Duplicate reward' : 'New sticker unlocked'}
          </span>
          <span>{result.prize.rarity}</span>
          <span>{result.attemptsUsed} tries used</span>
        </div>
        <div className="completion-actions">
          <button className="playroom-button primary" type="button" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="playroom-button secondary" type="button" onClick={onBackToPlayroom}>
            Back to Playroom
          </button>
        </div>
      </section>
    </div>
  );
};

export default SuccessModal;
