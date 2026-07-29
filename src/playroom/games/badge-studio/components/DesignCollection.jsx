import React from 'react';
import { Copy, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import BadgeArtwork from './BadgeArtwork';

const DesignCollection = ({
  designs,
  activeId,
  onSelect,
  onDuplicate,
  onDelete,
  onQuantity,
  onAddPhotos,
  totalQuantity,
  maxTotal,
  copy,
}) => (
  <aside className="badge-design-rail">
    <div className="badge-design-rail-title">
      <div>
        <h2>{copy.title} ({designs.length})</h2>
        <p>{copy.badgeLimit(totalQuantity, maxTotal)}</p>
      </div>
      <button type="button" className="badge-icon-action" onClick={onAddPhotos} aria-label={copy.addPhotosAria}>
        <Plus size={20} />
      </button>
    </div>

    <div className="badge-design-list">
      {designs.map((design, index) => (
        <article className={`badge-design-card${design.id === activeId ? ' active' : ''}`} key={design.id}>
          <button type="button" className="badge-design-preview" onClick={() => onSelect(design.id)}>
            <BadgeArtwork design={design} />
          </button>
          <div className="badge-design-card-copy">
            <div className="badge-design-card-heading">
              <strong>{copy.design} {index + 1}</strong>
              <span className={`badge-quality-dot ${design.quality}`}>
                {copy.quality[design.quality]}
              </span>
            </div>
            <span className="badge-file-name" title={design.imageName}>{design.imageName}</span>
            <div className="badge-quantity-control" aria-label={copy.quantityAria(index + 1)}>
              <button type="button" onClick={() => onQuantity(design.id, design.quantity - 1)} aria-label={copy.decrease}>−</button>
              <output>{design.quantity}</output>
              <button type="button" onClick={() => onQuantity(design.id, design.quantity + 1)} aria-label={copy.increase}>+</button>
            </div>
            <div className="badge-design-actions">
              <button type="button" onClick={() => onSelect(design.id)}><Pencil size={16} />{copy.edit}</button>
              <button type="button" onClick={() => onDuplicate(design.id)}><Copy size={16} />{copy.duplicate}</button>
              <button type="button" className="danger" onClick={() => onDelete(design.id)}><Trash2 size={16} />{copy.delete}</button>
            </div>
          </div>
        </article>
      ))}
    </div>

    <button type="button" className="badge-add-dropzone" onClick={onAddPhotos}>
      <Upload size={28} />
      <strong>{copy.addMore}</strong>
      <span>{copy.limits}</span>
    </button>
  </aside>
);

export default DesignCollection;
