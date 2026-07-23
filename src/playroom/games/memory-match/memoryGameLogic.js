export const shuffleCards = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export const createMemoryDeck = (stickers, pairCount) => {
  const selected = shuffleCards(stickers).slice(0, pairCount);
  const paired = selected.flatMap((sticker) => [
    {
      cardId: `${sticker.id}-a`,
      stickerId: sticker.id,
      sticker,
      isMatched: false,
    },
    {
      cardId: `${sticker.id}-b`,
      stickerId: sticker.id,
      sticker,
      isMatched: false,
    },
  ]);

  return shuffleCards(paired);
};

export const areCardsMatching = (firstCard, secondCard) =>
  Boolean(firstCard && secondCard && firstCard.cardId !== secondCard.cardId && firstCard.stickerId === secondCard.stickerId);

