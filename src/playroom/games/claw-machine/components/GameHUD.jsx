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

const GameHUD = ({ status, coins, onRestart, restartDisabled = false, copy }) => (
  <section className="claw-hud" aria-label={copy.aria}>
    <StatPill icon={<Coins size={18} />} label={copy.joyCoins} value={coins} />
    <button
      className="claw-mini-button"
      type="button"
      onClick={onRestart}
      disabled={restartDisabled}
      title={restartDisabled ? copy.restartLocked : undefined}
    >
      <RotateCcw size={18} />
      {copy.restart}
    </button>
    <div className="claw-mobile-live-status">
      <LiveGameStats status={status} copy={copy} />
    </div>
  </section>
);

export const LiveGameStats = ({ status, copy }) => (
  <section className="claw-live-status-card" aria-label={copy.liveAria}>
    <span className="claw-session-kicker">{copy.live}</span>
    <div className="claw-live-stats">
      <StatPill icon={<Trophy size={18} />} label={copy.tries} value={status.attemptsRemaining} />
      <StatPill
        icon={<Timer size={18} />}
        label={copy.timeLeft}
        value={`${status.turnSecondsRemaining ?? 10}s`}
      />
      <StatPill icon={<Gauge size={18} />} label={copy.swing} value={`${status.swingPower || 0}%`} />
    </div>
    <div className="claw-swing-meter" aria-label={copy.swingPower(status.swingPower || 0)}>
      <span style={{ width: `${Math.min(100, status.swingPower || 0)}%` }} />
    </div>
    <p className="claw-status-message" aria-live="polite">
      {status.gripStatus || status.statusMessage}
    </p>
  </section>
);

export default GameHUD;
