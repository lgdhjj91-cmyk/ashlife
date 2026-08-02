import React from 'react';
import { badgeConfig } from '../badgeStudioConfig';
import { getBadgeGuideGeometry } from '../badgeStudioLogic';

const badgeGuideGeometry = getBadgeGuideGeometry(badgeConfig);

const BadgeArtwork = ({ design, className = '', showGuides = false, view = 'artwork' }) => {
  if (!design) return <div className={`badge-artwork is-empty ${className}`.trim()} />;

  const ratio = design.width / design.height;
  const transform = design.transform || {};
  const imageStyle = {
    width: ratio >= 1 ? `${ratio * 100}%` : '100%',
    height: ratio >= 1 ? '100%' : `${(1 / ratio) * 100}%`,
    left: `${50 + (Number(transform.offsetX) || 0) * 100}%`,
    top: `${50 + (Number(transform.offsetY) || 0) * 100}%`,
    transform: `translate(-50%, -50%) scale(${Number(transform.zoom) || 1}) rotate(${Number(transform.rotation) || 0}deg)`,
  };
  const artworkStyle = {
    '--badge-front-inset': `${badgeGuideGeometry.frontInsetPercent}%`,
    '--badge-safe-inset': `${badgeGuideGeometry.safeInsetPercent}%`,
    '--badge-front-scale': badgeGuideGeometry.frontScale,
  };

  return (
    <div
      className={`badge-artwork ${view === 'front' ? 'is-front-preview' : ''} ${className}`.trim()}
      style={artworkStyle}
    >
      <img src={design.imageUrl} alt="" draggable="false" style={imageStyle} />
      {showGuides && (
        <>
          <span className="badge-wrap-guide" aria-hidden="true" />
          <span className="badge-cut-guide" aria-hidden="true" />
          <span className="badge-front-guide" aria-hidden="true" />
          <span className="badge-safe-guide" aria-hidden="true" />
        </>
      )}
    </div>
  );
};

export default BadgeArtwork;
