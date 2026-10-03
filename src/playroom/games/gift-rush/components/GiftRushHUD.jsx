import React from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
const GiftRushHUD = ({ state, copy, challenge, challengeProgress, soundEnabled, onSound, onPause }) => (
  <div className="gift-hud">
    <div className="gift-hud-values">
      <div><span>{copy.time}</span><strong className={state.elapsedMs >= 80000 ? 'gift-time-low' : ''}>{Math.ceil((90000 - state.elapsedMs) / 1000)}<small>s</small></strong></div>
      <div><span>{copy.score}</span><strong>{state.stats.score.toLocaleString()}</strong></div>
      <div><span>{copy.combo}</span><strong>×{state.stats.combo}<small> ♡</small></strong></div>
    </div>
    {state.mode === 'daily' ? <div className="gift-daily-progress"><span>{copy.dailyGoals[challenge.id]}</span><strong>{Math.min(challengeProgress.progress, challenge.target)} / {challenge.target}</strong></div> : <span className="gift-mode-pill">{copy.practice}</span>}
    <div className="gift-hud-actions">
      <button type="button" className="gift-icon" onClick={onSound} aria-label={soundEnabled ? copy.soundOff : copy.soundOn}>{soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
      <button type="button" className="gift-icon" onClick={onPause} aria-label={copy.pause}><Pause size={19} /></button>
    </div>
  </div>
);
export default GiftRushHUD;
