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
}) => (
  <aside className="badge-design-rail">
    <div className="badge-design-rail-title">
      <div>
        <h2>Your designs ({designs.length})</h2>
        <p>{totalQuantity} of {maxTotal} badges</p>
      </div>
      <button type="button" className="badge-icon-action" onClick={onAddPhotos} aria-label="Add photos">
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
              <strong>Design {index + 1}</strong>
              <span className={`badge-quality-dot ${design.quality}`}>{design.quality}</span>
            </div>
            <span className="badge-file-name" title={design.imageName}>{design.imageName}</span>
            <div className="badge-quantity-control" aria-label={`Quantity for design ${index + 1}`}>
              <button type="button" onClick={() => onQuantity(design.id, design.quantity - 1)} aria-label="Decrease quantity">−</button>
              <output>{design.quantity}</output>
              <button type="button" onClick={() => onQuantity(design.id, design.quantity + 1)} aria-label="Increase quantity">+</button>
            </div>
            <div className="badge-design-actions">
              <button type="button" onClick={() => onSelect(design.id)}><Pencil size={16} />Edit</button>
              <button type="button" onClick={() => onDuplicate(design.id)}><Copy size={16} />Duplicate</button>
              <button type="button" className="danger" onClick={() => onDelete(design.id)}><Trash2 size={16} />Delete</button>
            </div>
          </div>
        </article>
      ))}
    </div>

    <button type="button" className="badge-add-dropzone" onClick={onAddPhotos}>
      <Upload size={28} />
      <strong>Add more photos</strong>
      <span>JPG, PNG or WebP · up to 15 MB each</span>
    </button>
  </aside>
);

export default DesignCollection;
