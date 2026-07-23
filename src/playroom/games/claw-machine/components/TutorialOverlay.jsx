import React from 'react';
import { X } from 'lucide-react';

const steps = [
  'Move left or right to position the trolley above a prize.',
  'Press Drop, then press Drop / Grab again to close the claw.',
  'Move with the swing to build momentum.',
  'Counter-swing to slow down and aim more carefully.',
  'Release at the right moment so the prize lands in the hole.',
];

const TutorialOverlay = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="claw-overlay-backdrop" role="dialog" aria-modal="true" aria-label="How to play Ashlife Swing and Win">
      <section className="claw-overlay-panel">
        <div className="claw-overlay-title">
          <div>
            <span className="playroom-pill">How to Play</span>
            <h2>Swing, Grab & Drop</h2>
          </div>
          <button className="playroom-icon-button" type="button" onClick={onClose} aria-label="Close how to play">
            <X size={20} />
          </button>
        </div>
        <ol className="claw-tutorial-steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button className="playroom-button primary" type="button" onClick={onClose}>
          Start Playing
        </button>
      </section>
    </div>
  );
};

export default TutorialOverlay;
