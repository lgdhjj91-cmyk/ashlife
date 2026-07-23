import React from 'react';
import { Coins, Gauge, RotateCcw, Timer, Trophy } from 'lucide-react';

const StatPill = ({ icon, label, value }) => (
  <span className="claw-stat-pill">
    {icon}
    <span>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  </span>
);

const GameHUD = ({ status, coins, onRestart }) => (
  <section className="claw-hud" aria-label="Ashlife Swing & Win status">
    <StatPill icon={<Coins size={18} />} label="Joy Coins" value={coins} />
    <StatPill icon={<Trophy size={18} />} label="Tries" value={status.attemptsRemaining} />
    <StatPill icon={<Timer size={18} />} label="Time" value={`${status.elapsedSeconds || 0}s`} />
    <StatPill icon={<Gauge size={18} />} label="Swing" value={`${status.swingPower || 0}%`} />
    <button className="claw-mini-button" type="button" onClick={onRestart}>
      <RotateCcw size={18} />
      Restart
    </button>
    <div className="claw-swing-meter" aria-label={`Swing power ${status.swingPower || 0}%`}>
      <span style={{ width: `${Math.min(100, status.swingPower || 0)}%` }} />
    </div>
    <p className="claw-status-message" aria-live="polite">
      {status.gripStatus || status.statusMessage}
    </p>
  </section>
);

export default GameHUD;
