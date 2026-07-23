import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, PackageSearch, Sparkles, Trophy } from 'lucide-react';
import { formatTime } from '../games/memory-match/scoring';

const CompletionModal = ({ completion, labels, onPlayAgain, onChangeDifficulty, onViewAlbum, onBackToPlayroom }) => {
  if (!completion) return null;
  const text = labels.completion;
  const completionStickerName = completion.sticker
    ? labels.stickerNames[completion.sticker.id] || completion.sticker.name
    : text.albumFull;
  const dailyStickerName = completion.dailyRewardSticker
    ? labels.stickerNames[completion.dailyRewardSticker.id] || completion.dailyRewardSticker.name
    : '';

  return (
    <div className="playroom-modal-backdrop" role="dialog" aria-modal="true" aria-label={text.dialogLabel}>
      <section className="playroom-modal completion-modal">
        <div className="celebration-stars" aria-hidden="true">
          <span>*</span>
          <span>*</span>
          <span>*</span>
        </div>
        <span className="playroom-pill">{text.completePill}</span>
        <h2>{text.heading}</h2>
        <div className="completion-stats">
          <span>{text.difficulty} <strong>{labels.difficulty[completion.difficulty]}</strong></span>
          <span>{text.time} <strong>{formatTime(completion.elapsedSeconds)}</strong></span>
          <span>{text.moves} <strong>{completion.moves}</strong></span>
          <span>{text.score} <strong>{completion.score}</strong></span>
        </div>
        <div className="completion-rewards">
          <div>
            <Trophy size={24} />
            <strong>{completion.coins}</strong>
            <span>{text.coinsEarned}</span>
          </div>
          <div>
            <Gift size={24} />
            <strong>{completionStickerName}</strong>
            <span>{text.newSticker}</span>
          </div>
        </div>
        <p className="daily-result">
          {completion.dailySatisfied
            ? completion.dailyRewardSticker
              ? text.dailyUnlocked
                  .replace('{sticker}', dailyStickerName)
                  .replace('{coins}', completion.dailyRewardCoins)
              : text.dailyAlreadyClaimed
            : `${text.dailyChallenge}: ${labels.challengeTitles[completion.dailyChallenge.id] || completion.dailyChallenge.title}`}
        </p>
        <div className="completion-actions">
          <button className="playroom-button primary" type="button" onClick={onPlayAgain}>
            <Sparkles size={18} />
            {text.playAgain}
          </button>
          <button className="playroom-button secondary" type="button" onClick={onChangeDifficulty}>
            {text.changeDifficulty}
          </button>
          <button className="playroom-button secondary" type="button" onClick={onViewAlbum}>
            {text.viewAlbum}
          </button>
          <Link
            className="playroom-button secondary"
            to={`/shop?category=${encodeURIComponent(completion.sticker?.productCategory || 'Stationery')}`}
          >
            <PackageSearch size={18} />
            {text.exploreProducts}
          </Link>
          <button className="playroom-button secondary" type="button" onClick={onBackToPlayroom}>
            {text.backToPlayroom}
          </button>
          <Link className="playroom-button quiet" to="/">
            {text.returnToShop}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CompletionModal;
