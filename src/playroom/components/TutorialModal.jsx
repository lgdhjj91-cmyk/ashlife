import React from 'react';
import { X } from 'lucide-react';

const TutorialModal = ({ labels, onClose }) => (
  <div className="playroom-modal-backdrop" role="dialog" aria-modal="true" aria-label={labels.tutorial.dialogLabel}>
    <section className="playroom-modal tutorial-modal">
      <div className="modal-title-row">
        <div>
          <span className="playroom-pill">{labels.tutorial.pill}</span>
          <h2>{labels.memoryTitle}</h2>
        </div>
        <button type="button" className="playroom-icon-button" onClick={onClose} aria-label="Close tutorial">
          <X size={20} />
        </button>
      </div>
      <ol className="tutorial-list">
        {labels.tutorial.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button className="playroom-button primary" type="button" onClick={onClose}>
        {labels.tutorial.gotIt}
      </button>
    </section>
  </div>
);

export default TutorialModal;
