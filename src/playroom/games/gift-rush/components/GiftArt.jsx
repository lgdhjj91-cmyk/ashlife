import React, { useState } from 'react';

const atlasPath = 'assets/playroom/gift-rush/customers/customer-atlas.webp';
const rows = { bunny: [0, 411], bear: [411, 357], chick: [768, 356] };
const columns = { waiting: 0, happy: 1, disappointed: 2 };

export const GiftSprite = ({ customerId = 'bunny', expression = 'waiting', label, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const [top, height] = rows[customerId] || rows.bunny;
  return (
    <span className={'gift-sprite ' + className} role="img" aria-label={label}>
      {failed ? <span className="gift-art-fallback">{label}</span> : (
        <span className="gift-sprite-crop" style={{ aspectRatio: '362 / ' + height }}>
          <img src={import.meta.env.BASE_URL + atlasPath} alt="" width="1086" height="1448"
            draggable="false" onError={() => setFailed(true)}
            style={{ left: -(columns[expression] || 0) * 100 + '%', top: -(top / height) * 100 + '%' }} />
        </span>
      )}
    </span>
  );
};
export const ProductImage = ({ product, label, className = '' }) => {
  const [failed, setFailed] = useState(false);
  return failed
    ? <span className={'gift-art-fallback ' + className}>{label}</span>
    : <img className={className} src={import.meta.env.BASE_URL + product.imagePath} alt={label}
        width="64" height="64" draggable="false" onError={() => setFailed(true)} />;
};
