import React, { useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  RefreshCcw,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import BadgeArtwork from './BadgeArtwork';
import BadgeProductionNotice from './BadgeProductionNotice';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const qualityIcons = {
  good: CheckCircle2,
  acceptable: CheckCircle2,
  low: AlertTriangle,
};

const BadgeCanvas = ({ design, onTransform, onReset, onReplace, copy, productionGuideCopy }) => {
  const stageRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const QualityIcon = qualityIcons[design.quality] || qualityIcons.low;

  const patchTransform = (patch) => onTransform({ ...design.transform, ...patch });

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = [...pointersRef.current.values()];
    if (pointers.length === 1) {
      gestureRef.current = {
        mode: 'drag',
        startX: event.clientX,
        startY: event.clientY,
        offsetX: design.transform.offsetX,
        offsetY: design.transform.offsetY,
      };
    } else if (pointers.length === 2) {
      gestureRef.current = {
        mode: 'pinch',
        distance: Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y),
        zoom: design.transform.zoom,
      };
    }
  };

  const handlePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId) || !gestureRef.current) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = [...pointersRef.current.values()];
    const stageSize = stageRef.current?.clientWidth || 1;

    if (pointers.length === 1 && gestureRef.current.mode === 'drag') {
      patchTransform({
        offsetX: clamp(
          gestureRef.current.offsetX + (event.clientX - gestureRef.current.startX) / stageSize,
          -1,
          1
        ),
        offsetY: clamp(
          gestureRef.current.offsetY + (event.clientY - gestureRef.current.startY) / stageSize,
          -1,
          1
        ),
      });
    } else if (pointers.length === 2 && gestureRef.current.mode === 'pinch') {
      const distance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      patchTransform({ zoom: clamp(gestureRef.current.zoom * (distance / gestureRef.current.distance), 1, 4) });
    }
  };

  const handlePointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size === 0) gestureRef.current = null;
  };

  return (
    <section className="badge-editor-panel">
      <BadgeProductionNotice copy={productionGuideCopy} compact />
      <div className="badge-editor-intro">
        <p>{copy.instruction}</p>
        <span className={`badge-quality ${design.quality}`}>
          <QualityIcon size={18} />
          {copy.quality[design.quality] || copy.quality.low}
        </span>
      </div>

      <div
        className="badge-canvas-stage"
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={(event) => {
          event.preventDefault();
          patchTransform({ zoom: clamp(design.transform.zoom + (event.deltaY > 0 ? -0.08 : 0.08), 1, 4) });
        }}
        role="application"
        aria-label={copy.editorAria}
      >
        <BadgeArtwork design={design} showGuides />
      </div>

      <div className="badge-guide-legend" aria-label={copy.legendAria}>
        <span><i className="cut" />{copy.cutEdge}</span>
        <span><i className="front" />{copy.frontFace}</span>
        <span><i className="safe" />{copy.safeArea}</span>
      </div>

      <div className="badge-production-guide">
        <div className="badge-wrap-explanation">
          <Info size={21} aria-hidden="true" />
          <div>
            <strong>{copy.wrapArea}</strong>
            <p>{copy.wrapExplanation}</p>
          </div>
        </div>
        <div className="badge-front-preview-card">
          <div className="badge-front-preview-visual" aria-hidden="true">
            <BadgeArtwork design={design} view="front" />
          </div>
          <div>
            <strong><Eye size={18} aria-hidden="true" />{copy.frontPreviewTitle}</strong>
            <p>{copy.frontPreviewDescription}</p>
          </div>
        </div>
      </div>

      <div className="badge-slider-grid">
        <label>
          <span>{copy.zoom} <output>{Math.round(design.transform.zoom * 100)}%</output></span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={design.transform.zoom}
            onChange={(event) => patchTransform({ zoom: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>{copy.rotation} <output>{Math.round(design.transform.rotation)}°</output></span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={design.transform.rotation}
            onChange={(event) => patchTransform({ rotation: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="badge-editor-toolbar">
        <button type="button" onClick={() => patchTransform({ rotation: design.transform.rotation - 15 })}>
          <RotateCcw size={19} />{copy.rotateLeft}
        </button>
        <button type="button" onClick={() => patchTransform({ rotation: design.transform.rotation + 15 })}>
          <RotateCw size={19} />{copy.rotateRight}
        </button>
        <button type="button" onClick={onReset}>
          <RefreshCcw size={19} />{copy.reset}
        </button>
        <button type="button" className="replace" onClick={onReplace}>
          <ImagePlus size={19} />{copy.replacePhoto}
        </button>
      </div>
    </section>
  );
};

export default BadgeCanvas;
