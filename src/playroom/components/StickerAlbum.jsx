import React from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, ShoppingBag, X } from 'lucide-react';
import { stickerCategories, stickers } from '../data/stickers';

const StickerAlbum = ({ progress, labels, onClose }) => {
  const unlocked = new Set(progress.unlockedStickers);
  const text = labels.album;

  return (
    <div className="playroom-modal-backdrop" role="dialog" aria-modal="true" aria-label={text.dialogLabel}>
      <section className="playroom-modal sticker-album-modal">
        <div className="modal-title-row">
          <div>
            <span className="playroom-pill">{text.pill}</span>
            <h2>{text.title}</h2>
          </div>
          <button type="button" className="playroom-icon-button" onClick={onClose} aria-label="Close sticker album">
            <X size={20} />
          </button>
        </div>

        {stickerCategories.map((category) => {
          const categoryStickers = stickers.filter((sticker) => sticker.category === category);
          if (categoryStickers.length === 0) return null;

          return (
            <div className="album-category" key={category}>
              <h3>{labels.categories[category] || category}</h3>
              <div className="album-grid">
                {categoryStickers.map((sticker) => {
                  const isUnlocked = unlocked.has(sticker.id);
                  const isRareLocked = !isUnlocked && ['rare', 'special'].includes(sticker.rarity);
                  const stickerName = labels.stickerNames[sticker.id] || sticker.name;
                  return (
                    <article className={`album-entry ${isUnlocked ? 'unlocked' : 'locked'}`} key={sticker.id}>
                      <div className="album-art">
                        {isUnlocked ? (
                          <img src={sticker.image} alt={sticker.alt} loading="lazy" />
                        ) : (
                          <span className={isRareLocked ? 'rare-secret' : ''}>
                            <LockKeyhole size={28} />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4>{isUnlocked || !isRareLocked ? stickerName : text.mystery}</h4>
                        <p>{labels.rarity[sticker.rarity] || sticker.rarity} - {labels.categories[sticker.category] || sticker.category}</p>
                        {isUnlocked && progress.stickerUnlockDates[sticker.id] && (
                          <small>{text.unlocked} {progress.stickerUnlockDates[sticker.id]}</small>
                        )}
                        {isUnlocked && sticker.productCategory && (
                          <Link
                            className="album-shop-link"
                            to={`/shop?category=${encodeURIComponent(sticker.productCategory)}`}
                          >
                            <ShoppingBag size={15} />
                            {text.explore} {labels.productCategories[sticker.productCategory] || sticker.productCategory}
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default StickerAlbum;
