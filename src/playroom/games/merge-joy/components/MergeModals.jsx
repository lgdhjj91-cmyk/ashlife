import React from 'react';
import { X } from 'lucide-react';
import { mergeTiers, getMergeTier } from '../data/mergeTiers.js';

const Modal = ({ className = '', label, children, onClose }) => (
  <div className="merge-modal-backdrop" role="dialog" aria-modal="true" aria-label={label}>
    <section className={`merge-modal ${className}`}>
      {onClose && <button className="merge-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>}
      {children}
    </section>
  </div>
);

export const MergeTutorial = ({ onClose }) => (
  <Modal label="How to play Merge and Joy" onClose={onClose}>
    <span className="merge-modal-kicker">HOW TO PLAY</span>
    <h2>Drop, match and make joy!</h2>
    <ol className="merge-tutorial-steps">
      <li><strong>1</strong><span>Move the item left or right.</span></li>
      <li><strong>2</strong><span>Tap to drop it!</span></li>
      <li><strong>3</strong><span>Two matching items merge.</span></li>
      <li><strong>4</strong><span>Bigger items give more points.</span></li>
      <li><strong>5</strong><span>Don&apos;t let the pile stay above the danger line!</span></li>
    </ol>
    <button className="merge-primary-button" type="button" onClick={onClose}>Let&apos;s Play</button>
  </Modal>
);

export const MergeDiscoveryModal = ({ tier, progressCount, onClose }) => {
  const piece = getMergeTier(tier);
  if (!piece) return null;
  return (
    <Modal className="merge-discovery-modal" label="New Merge and Joy discovery" onClose={onClose}>
      <span className="merge-modal-kicker">NEW DISCOVERY!</span>
      <img src={piece.image} alt={piece.name} />
      <h2>{piece.name}</h2>
      <p>{progressCount} / {mergeTiers.length} pieces discovered</p>
    </Modal>
  );
};

export const MergeLegendaryModal = ({ onClose }) => (
  <Modal className="merge-legendary-modal" label="Legendary Golden Ashlife Bunny merge" onClose={onClose}>
    <span className="merge-modal-kicker">LEGENDARY MERGE!</span>
    <img src={getMergeTier(11).image} alt="Golden Ashlife Bunny" />
    <h2>Golden Ashlife Bunny</h2>
    <p>Your collection just became legendary.</p>
  </Modal>
);

export const MergeGameOverModal = ({ summary, onReplay, onCollection, onBack }) => {
  if (!summary) return null;
  return (
    <Modal label="Merge and Joy game results">
      <span className="merge-modal-kicker">ROUND COMPLETE</span>
      <h2>Lovely merging!</h2>
      <div className="merge-summary-grid">
        <div><span>Score</span><strong>{summary.stats.score.toLocaleString()}</strong></div>
        <div><span>Best combo</span><strong>×{summary.stats.maxCombo}</strong></div>
        <div><span>Largest piece</span><strong>{getMergeTier(summary.stats.highestTier)?.name}</strong></div>
        <div><span>Joy Coins</span><strong>+{summary.coinAward}</strong></div>
      </div>
      {summary.medal && <p className="merge-medal-result">{summary.medal.toUpperCase()} daily medal</p>}
      <div className="merge-modal-actions">
        <button className="merge-primary-button" type="button" onClick={onReplay}>Play Again</button>
        <button className="merge-secondary-button" type="button" onClick={onCollection}>Collection</button>
        <button className="merge-secondary-button" type="button" onClick={onBack}>Back to Playroom</button>
      </div>
    </Modal>
  );
};

export const MergeCollectionModal = ({ progress, onClose }) => (
  <Modal className="merge-collection-modal" label="Merge and Joy collection" onClose={onClose}>
    <span className="merge-modal-kicker">MERGE COLLECTION</span>
    <h2>Your kawaii discoveries</h2>
    <div className="merge-collection-grid">
      {mergeTiers.map((piece) => {
        const discovery = progress.mergeJoy.discoveries[piece.tier];
        const unlocked = piece.tier === 1 || Boolean(discovery);
        return (
          <article className={unlocked ? 'is-unlocked' : 'is-locked'} key={piece.tier}>
            <img src={piece.image} alt={unlocked ? piece.name : ''} />
            <strong>{unlocked ? piece.name : 'Mystery Piece'}</strong>
            <small>{unlocked ? `${discovery?.count || 0} created` : 'Keep merging!'}</small>
          </article>
        );
      })}
    </div>
  </Modal>
);
