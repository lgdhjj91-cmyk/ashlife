import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Hand } from 'lucide-react';

const bindHold = (onChange) => ({
  onPointerDown: (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onChange(true);
  },
  onPointerUp: (event) => {
    event.preventDefault();
    onChange(false);
  },
  onPointerCancel: () => onChange(false),
  onPointerLeave: () => onChange(false),
  onMouseDown: (event) => {
    event.preventDefault();
    onChange(true);
  },
  onMouseUp: (event) => {
    event.preventDefault();
    onChange(false);
  },
  onMouseLeave: () => onChange(false),
  onTouchStart: (event) => {
    event.preventDefault();
    onChange(true);
  },
  onTouchEnd: () => onChange(false),
  onTouchCancel: () => onChange(false),
});

const MobileControls = ({ layout, onMove, onDropGrab, onRelease }) => {
  const moveButtons = (
    <div className="claw-touch-row">
      <button className="claw-touch-button" type="button" aria-label="Move left" {...bindHold((pressed) => onMove('left', pressed))}>
        <ArrowLeft size={30} />
      </button>
      <button className="claw-touch-button" type="button" aria-label="Move right" {...bindHold((pressed) => onMove('right', pressed))}>
        <ArrowRight size={30} />
      </button>
    </div>
  );

  const actionButtons = (
    <div className="claw-touch-row">
      <button className="claw-touch-button action" type="button" onClick={onDropGrab}>
        <ArrowDown size={24} />
        Drop / Grab
      </button>
      <button className="claw-touch-button action" type="button" onClick={onRelease}>
        <Hand size={24} />
        Release
      </button>
    </div>
  );

  return (
    <section className={`claw-mobile-controls ${layout === 'left' ? 'left-layout' : ''}`} aria-label="Touch controls">
      {layout === 'left' ? actionButtons : moveButtons}
      {layout === 'left' ? moveButtons : actionButtons}
    </section>
  );
};

export default MobileControls;
