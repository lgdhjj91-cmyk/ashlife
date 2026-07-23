import React from 'react';
import GameCard from './GameCard';

const MemoryGrid = ({ cards, difficulty, selectedIds, isHinting, reduceMotion, labels, onChoose }) => (
  <div className={`memory-grid memory-grid-${difficulty}`} aria-label={labels.gridLabel}>
    {cards.map((card) => (
      <GameCard
        key={card.cardId}
        card={card}
        isFaceUp={selectedIds.includes(card.cardId)}
        isHinting={isHinting && !card.isMatched}
        reduceMotion={reduceMotion}
        labels={labels}
        onChoose={onChoose}
      />
    ))}
  </div>
);

export default MemoryGrid;
