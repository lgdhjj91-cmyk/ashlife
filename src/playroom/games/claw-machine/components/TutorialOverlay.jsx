import React from 'react';
import { X } from 'lucide-react';

const TutorialOverlay = ({ open, onClose, copy }) => {
  if (!open) return null;

  return (
    <div className="claw-overlay-backdrop" role="dialog" aria-modal="true" aria-label={copy.aria}>
      <section className="claw-overlay-panel">
        <div className="claw-overlay-title">
          <div>
            <span className="playroom-pill">{copy.label}</span>
            <h2>{copy.title}</h2>
          </div>
          <button className="playroom-icon-button" type="button" onClick={onClose} aria-label={copy.close}>
            <X size={20} />
          </button>
        </div>
        <ol className="claw-tutorial-steps">
          {copy.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button className="playroom-button primary" type="button" onClick={onClose}>
          {copy.start}
        </button>
      </section>
    </div>
  );
};

export default TutorialOverlay;
