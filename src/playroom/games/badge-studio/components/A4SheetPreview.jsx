import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { a4Config, badgeConfig } from '../badgeStudioConfig';
import BadgeArtwork from './BadgeArtwork';

const A4SheetPreview = ({ page, pageIndex, pageCount, designs, onMove, globalOffset }) => {
  const designMap = new Map(designs.map((design) => [design.id, design]));
  const diameterPercent = (badgeConfig.artworkDiameterMm / a4Config.widthMm) * 100;

  return (
    <section className="a4-preview-panel">
      <div className="a4-preview-heading">
        <div>
          <h2>Sheet {pageIndex + 1}</h2>
          <p>{page.length} badge{page.length === 1 ? '' : 's'} · {a4Config.slotsPerSheet - page.length} empty slots</p>
        </div>
        <span>{pageIndex + 1} / {pageCount}</span>
      </div>

      <div className="a4-paper" aria-label={`A4 print sheet ${pageIndex + 1}`}>
        {a4Config.slots.map((slot, slotIndex) => {
          const entry = page[slotIndex];
          const design = entry ? designMap.get(entry.designId) : null;
          const globalIndex = globalOffset + slotIndex;
          return (
            <div
              className={`a4-slot${design ? ' filled' : ''}`}
              style={{
                width: `${diameterPercent}%`,
                left: `${(slot.xMm / a4Config.widthMm) * 100}%`,
                top: `${(slot.yMm / a4Config.heightMm) * 100}%`,
              }}
              key={`${pageIndex}-${slotIndex}`}
            >
              {design ? (
                <>
                  <BadgeArtwork design={design} />
                  <div className="a4-slot-actions">
                    <button type="button" onClick={() => onMove(globalIndex, -1)} aria-label="Move badge left">
                      <ArrowLeft size={14} />
                    </button>
                    <span>{globalIndex + 1}</span>
                    <button type="button" onClick={() => onMove(globalIndex, 1)} aria-label="Move badge right">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <span className="a4-empty-slot">Empty</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default A4SheetPreview;
