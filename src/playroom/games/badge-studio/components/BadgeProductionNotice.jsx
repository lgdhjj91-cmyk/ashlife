import React from 'react';
import { Info } from 'lucide-react';

const BadgeProductionNotice = ({ copy, compact = false }) => (
  <aside
    className={`badge-production-notice${compact ? ' compact' : ''}`}
    aria-labelledby={compact ? 'badge-production-notice-editor' : 'badge-production-notice-upload'}
  >
    <div className="badge-production-notice-heading">
      <span className="badge-production-notice-icon" aria-hidden="true"><Info size={20} /></span>
      <div>
        <span className="badge-production-notice-eyebrow">{copy.eyebrow}</span>
        <h2 id={compact ? 'badge-production-notice-editor' : 'badge-production-notice-upload'}>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>
    </div>

    <div className="badge-production-zones">
      <div className="badge-production-zone cut">
        <span aria-hidden="true">70</span>
        <div><strong>{copy.cutTitle}</strong><p>{copy.cutDescription}</p></div>
      </div>
      <div className="badge-production-zone front">
        <span aria-hidden="true">58</span>
        <div><strong>{copy.frontTitle}</strong><p>{copy.frontDescription}</p></div>
      </div>
      <div className="badge-production-zone safe">
        <span aria-hidden="true">54</span>
        <div><strong>{copy.safeTitle}</strong><p>{copy.safeDescription}</p></div>
      </div>
    </div>
  </aside>
);

export default BadgeProductionNotice;
