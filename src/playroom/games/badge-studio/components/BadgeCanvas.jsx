import React, { useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  RefreshCcw,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import BadgeArtwork from './BadgeArtwork';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const qualityCopy = {
  good: { label: 'Good quality', icon: CheckCircle2 },
  acceptable: { label: 'Acceptable quality', icon: CheckCircle2 },
  low: { label: 'Low resolution', icon: AlertTriangle },
};

const BadgeCanvas = ({ design, onTransform, onReset, onReplace }) => {
  const stageRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const quality = qualityCopy[design.quality] || qualityCopy.low;
  const QualityIcon = quality.icon;

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
      <div className="badge-editor-intro">
        <p>Move and zoom until the important part stays inside the safe circle.</p>
        <span className={`badge-quality ${design.quality}`}>
          <QualityIcon size={18} />
          {quality.label}
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
        aria-label="Badge photo editor. Drag the photo to reposition it."
      >
        <BadgeArtwork design={design} showGuides />
      </div>

      <div className="badge-guide-legend" aria-label="Badge guide legend">
        <span><i className="solid" />Artwork edge 70 mm</span>
        <span><i className="dashed" />Safe area 54 mm</span>
      </div>

      <div className="badge-slider-grid">
        <label>
          <span>Zoom <output>{Math.round(design.transform.zoom * 100)}%</output></span>
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
          <span>Rotation <output>{Math.round(design.transform.rotation)}°</output></span>
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
          <RotateCcw size={19} />Rotate left
        </button>
        <button type="button" onClick={() => patchTransform({ rotation: design.transform.rotation + 15 })}>
          <RotateCw size={19} />Rotate right
        </button>
        <button type="button" onClick={onReset}>
          <RefreshCcw size={19} />Reset
        </button>
        <button type="button" className="replace" onClick={onReplace}>
          <ImagePlus size={19} />Replace photo
        </button>
      </div>
    </section>
  );
};

export default BadgeCanvas;
