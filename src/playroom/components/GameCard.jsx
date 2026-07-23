import React, { memo } from 'react';

const GameCard = memo(({ card, isFaceUp, isHinting, reduceMotion, labels, onChoose }) => {
  const shouldShow = isFaceUp || card.isMatched || isHinting;
  const stickerName = labels.stickerNames[card.sticker.id] || card.sticker.name;

  return (
    <button
      type="button"
      className={[
        'memory-card',
        shouldShow ? 'is-open' : '',
        card.isMatched ? 'is-matched' : '',
        reduceMotion ? 'reduce-motion' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onChoose(card.cardId)}
      aria-label={shouldShow ? labels.cardLabel.replace('{name}', stickerName) : labels.hiddenCard}
      aria-pressed={shouldShow}
      disabled={card.isMatched}
    >
      <span className="memory-card-inner">
        <span className="memory-card-face memory-card-back" aria-hidden="true">
          <span className="card-back-bow">ASHLIFE</span>
        </span>
        <span className="memory-card-face memory-card-front">
          <img src={card.sticker.image} alt={card.sticker.alt} loading="lazy" />
          <span>{stickerName}</span>
        </span>
      </span>
    </button>
  );
});

GameCard.displayName = 'GameCard';

export default GameCard;
