import React from 'react';
import { Coins, RotateCcw } from 'lucide-react';
import { getMergeTier } from '../data/mergeTiers.js';

const PiecePreview = ({ label, tier }) => {
  const piece = getMergeTier(tier || 1);
  return (
    <div className={`merge-piece-preview merge-piece-preview-${label.toLowerCase()}`}>
      <span>{label}</span>
      <img src={piece.image} alt={piece.name} />
      <small>{piece.name}</small>
    </div>
  );
};

const MergeHUD = ({ gameState, progress, challenge, challengeResult, onRestart }) => (
  <>
    <aside className="merge-rail merge-rail-left" aria-label="Score and records">
      <section className="merge-stat-card merge-score-card">
        <span>SCORE</span>
        <strong>{(gameState.score || 0).toLocaleString()}</strong>
      </section>
      <section className="merge-stat-card merge-best-card">
        <span>BEST</span>
        <strong>{Math.max(progress.mergeJoy.highestScore || 0, gameState.score || 0).toLocaleString()}</strong>
      </section>
      <section className="merge-balance-card">
        <Coins size={22} />
        <div><span>Joy Coins</span><strong>{progress.coins}</strong></div>
      </section>
      <button className="merge-soft-button" type="button" onClick={onRestart}>
        <RotateCcw size={17} /> Restart
      </button>
    </aside>

    <aside className="merge-rail merge-rail-right" aria-label="Piece previews and daily challenge">
      <div className="merge-preview-row">
        <PiecePreview label="NEXT" tier={gameState.nextTier} />
        <PiecePreview label="AFTER" tier={gameState.afterTier} />
      </div>
      <section className={`merge-daily-card ${challengeResult.complete ? 'is-complete' : ''}`}>
        <div className="merge-daily-heading"><span>DAILY CHALLENGE</span><strong>{challengeResult.medal || 'ready'}</strong></div>
        <p>{challenge.title}</p>
        <div className="merge-daily-progress">
          <span style={{ width: `${Math.min(100, (challengeResult.value / challenge.thresholds[0]) * 100)}%` }} />
        </div>
        <small>{challengeResult.value.toLocaleString()} / {challenge.thresholds[0].toLocaleString()}</small>
      </section>
    </aside>
  </>
);

export default MergeHUD;
