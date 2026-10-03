import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const GiftRushDialog = ({ title, copy, onClose, children }) => {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = panel.current;
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')];
    focusable()[0]?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.addEventListener('keydown', keydown);
    return () => {
      dialog.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [onClose]);
  return createPortal(<div className="gift-dialog-backdrop">
    <section ref={panel} className="gift-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="gift-dialog-close gift-icon" onClick={onClose} aria-label={copy.close}><X size={20} /></button>
      <h2>{title}</h2>{children}
    </section>
  </div>, document.body);
};
export default GiftRushDialog;
