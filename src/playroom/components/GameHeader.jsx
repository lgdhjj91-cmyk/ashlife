import React from 'react';
import { Clock3, Coins, Lightbulb, RotateCcw, Trophy } from 'lucide-react';
import { formatTime } from '../games/memory-match/scoring';

const GameHeader = ({ game, coins, labels, onHint, onRestart }) => (
  <div className="game-header-panel">
    <div>
      <span className="playroom-pill">{labels.modeLabel.replace('{mode}', labels.difficulty[game.difficulty])}</span>
      <h2>{labels.memoryTitle}</h2>
    </div>
    <div className="game-stat-row" aria-label="Current game stats">
      <span>
        <Clock3 size={17} />
        {formatTime(game.elapsedSeconds)}
      </span>
      <span>
        <Trophy size={17} />
        {game.moves} moves
      </span>
      <span>
        <Coins size={17} />
        {coins}
      </span>
    </div>
    <div className="game-header-actions">
      <button className="playroom-button secondary" type="button" onClick={onHint} disabled={game.hintsRemaining <= 0 || game.isLocked}>
        <Lightbulb size={18} />
        {labels.hint} {game.hintsRemaining}
      </button>
      <button className="playroom-icon-button" type="button" onClick={onRestart} aria-label={labels.restart}>
        <RotateCcw size={20} />
      </button>
    </div>
  </div>
);

export default GameHeader;
