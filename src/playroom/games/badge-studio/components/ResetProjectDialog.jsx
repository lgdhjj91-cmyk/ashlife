import React, { useEffect, useRef } from 'react';
import { AlertTriangle, LoaderCircle, RotateCcw, X } from 'lucide-react';

const ResetProjectDialog = ({
  copy,
  isResetting,
  onCancel,
  onConfirm,
}) => {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isResetting) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isResetting, onCancel]);

  return (
    <div
      className="badge-reset-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isResetting) onCancel();
      }}
    >
      <section
        className="badge-reset-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialogAria}
      >
        <div className="badge-reset-dialog-icon">
          <AlertTriangle size={28} />
        </div>
        <button
          type="button"
          className="badge-reset-dialog-close"
          aria-label={copy.cancel}
          onClick={onCancel}
          disabled={isResetting}
        >
          <X size={20} />
        </button>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <div className="badge-reset-dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="badge-reset-cancel"
            onClick={onCancel}
            disabled={isResetting}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="badge-reset-confirm"
            onClick={onConfirm}
            disabled={isResetting}
          >
            {isResetting ? <LoaderCircle className="badge-reset-spinner" size={18} /> : <RotateCcw size={18} />}
            {isResetting ? copy.working : copy.confirm}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ResetProjectDialog;
