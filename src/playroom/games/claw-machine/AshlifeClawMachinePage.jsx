import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { usePlayroomProgress } from '../../hooks/usePlayroomProgress';
import { getLocalDateKey } from '../../utils/dateKey';
import {
  applyClawPrizeReward,
  isClassicAvailable,
  markClassicComplete,
} from './storage/clawMachineProgress';
import ClawMachineGame from './ClawMachineGame';
import GameHUD, { LiveGameStats } from './components/GameHUD';
import MobileControls from './components/MobileControls';
import SessionCard from './components/SessionCard';
import SessionSummaryModal from './components/SessionSummaryModal';
import TutorialOverlay from './components/TutorialOverlay';
import {
  appendSessionPrize,
  getSessionControlLocks,
  summarizeSession,
} from './systems/SessionFlow';
import './styles/claw-machine.css';

const modeOptions = [
  { key: 'practice', label: 'Practice', note: 'Unlimited tries' },
  { key: 'classic', label: 'Classic', note: 'Rewards enabled' },
];

const difficultyOptions = [
  { key: 'easy', label: 'Easy' },
  { key: 'normal', label: 'Normal' },
  { key: 'hard', label: 'Hard' },
];

const defaultStatus = {
  state: 'READY',
  statusMessage: 'Move the claw',
  gripStatus: '',
  swingPower: 0,
  attemptsRemaining: 'Unlimited',
  attemptsUsed: 0,
  score: 0,
  elapsedSeconds: 0,
  turnSecondsRemaining: 10,
  classicSessionEnded: false,
};

const AshlifeClawMachinePage = () => {
  const navigate = useNavigate();
  const progressActions = usePlayroomProgress();
  const { progress, summary, updateProgress, updateSettings } = progressActions;
  const progressRef = useRef(progress);
  const todayDateKey = useMemo(() => getLocalDateKey(), []);
  const [mode, setMode] = useState(() => {
    const selectedMode = progress.clawMachine.selectedMode || 'practice';
    return selectedMode === 'classic' && !isClassicAvailable(progress, todayDateKey)
      ? 'practice'
      : selectedMode;
  });
  const [difficulty, setDifficulty] = useState(progress.clawMachine.selectedDifficulty || 'normal');
  const [controlLayout, setControlLayout] = useState(progress.clawMachine.controlLayout || 'right');
  const [soundEnabled, setSoundEnabled] = useState(progress.clawMachine.soundEnabled || progress.settings.soundEnabled);
  const [showTutorial, setShowTutorial] = useState(!progress.clawMachine.tutorialCompleted);
  const [status, setStatus] = useState(defaultStatus);
  const [controls, setControls] = useState(null);
  const [sessionEntries, setSessionEntries] = useState([]);
  const sessionEntriesRef = useRef([]);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [paused, setPaused] = useState(false);
  const testMode = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('clawTest') === '1',
    []
  );

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!testMode || typeof window === 'undefined') return undefined;
    window.__ASHLIFE_CLAW_TEST__ = {
      getState: () => controls?.getDebugState?.() || null,
    };
    return () => {
      delete window.__ASHLIFE_CLAW_TEST__;
    };
  }, [controls, testMode]);

  const saveClawSetting = useCallback(
    (next) => {
      updateProgress((current) => ({
        ...current,
        clawMachine: {
          ...current.clawMachine,
          ...next,
        },
      }));
    },
    [updateProgress]
  );

  const resetSessionEntries = useCallback(() => {
    sessionEntriesRef.current = [];
    setSessionEntries([]);
    setSessionSummary(null);
  }, []);

  const classicAvailable = isClassicAvailable(progress, todayDateKey);
  const controlLocks = getSessionControlLocks({
    mode,
    attemptsUsed: status.attemptsUsed,
    sessionEnded: Boolean(sessionSummary) || status.classicSessionEnded,
  });

  const handleModeChange = (nextMode) => {
    if (controlLocks.mode) return;
    if (nextMode === 'classic' && !classicAvailable) return;
    resetSessionEntries();
    setMode(nextMode);
    saveClawSetting({ selectedMode: nextMode });
  };

  const handleDifficultyChange = (nextDifficulty) => {
    if (controlLocks.difficulty) return;
    resetSessionEntries();
    setDifficulty(nextDifficulty);
    saveClawSetting({ selectedDifficulty: nextDifficulty });
  };

  const handleControlLayoutChange = () => {
    const nextLayout = controlLayout === 'right' ? 'left' : 'right';
    setControlLayout(nextLayout);
    saveClawSetting({ controlLayout: nextLayout });
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    saveClawSetting({ tutorialCompleted: true });
  };

  const handleEvent = useCallback(
    (type, detail) => {
      if (type === 'attempt-updated' || type === 'game-ready' || type === 'grip-changed') {
        setStatus((current) => ({ ...current, ...detail }));
      }

      if (type === 'game-paused') setPaused(true);
      if (type === 'game-resumed') setPaused(false);

      if (type === 'prize-collected') {
        const { nextProgress, reward } = applyClawPrizeReward(progressRef.current, {
          prize: detail.prize,
          mode,
          difficulty,
          attemptsUsed: detail.attemptsUsed,
          remainingAttempts: detail.remainingAttempts,
          elapsedSeconds: detail.elapsedSeconds,
          bonuses: detail.bonuses,
        });
        progressRef.current = nextProgress;
        updateProgress(nextProgress);
        const entry = {
          prize: detail.prize,
          reward,
          attemptsUsed: detail.attemptsUsed,
        };
        const nextEntries = appendSessionPrize(sessionEntriesRef.current, entry);
        sessionEntriesRef.current = nextEntries;
        setSessionEntries(nextEntries);
      }

      if (type === 'classic-session-ended') {
        const completedProgress = markClassicComplete(progressRef.current, todayDateKey);
        progressRef.current = completedProgress;
        updateProgress(completedProgress);
        setSessionSummary({
          ...summarizeSession(sessionEntriesRef.current),
          attemptsUsed: detail.attemptsUsed,
        });
      }
    },
    [difficulty, mode, todayDateKey, updateProgress]
  );

  const toggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    saveClawSetting({ soundEnabled: nextSound });
    updateSettings({ soundEnabled: nextSound });
  };

  const togglePause = () => {
    if (paused) {
      controls?.resume();
      setPaused(false);
    } else {
      controls?.pause();
      setPaused(true);
    }
  };

  const controlApi = useMemo(
    () => ({
      onMove: (direction, pressed) => controls?.setMove(direction, pressed),
      onDropGrab: () => controls?.dropGrab(),
      onRelease: () => controls?.releasePrize(),
      onRestart: () => {
        if (controlLocks.restart) return;
        resetSessionEntries();
        controls?.restart();
      },
    }),
    [controlLocks.restart, controls, resetSessionEntries]
  );

  const playPractice = () => {
    resetSessionEntries();
    setMode('practice');
    saveClawSetting({ selectedMode: 'practice' });
  };

  return (
    <main
      className="page claw-page animate-fade-in"
      data-claw-test-mode={testMode ? 'true' : undefined}
      data-claw-debug={testMode ? JSON.stringify(status.debugState || {}) : undefined}
    >
      <div className="claw-page-shell">
        <header className="claw-topbar">
          <Link className="playroom-back-link" to="/play/">
            <ArrowLeft size={18} />
            Back to Playroom
          </Link>
          <div className="claw-topbar-actions">
            <Link className="playroom-button quiet" to="/">
              <Home size={18} />
              Back to Shop
            </Link>
            <button className="playroom-button quiet" type="button" onClick={() => setShowTutorial(true)}>
              How to Play
            </button>
            <button className="playroom-icon-button" type="button" onClick={toggleSound} aria-label="Toggle sound">
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button className="playroom-icon-button" type="button" onClick={togglePause} aria-label={paused ? 'Resume game' : 'Pause game'}>
              {paused ? <Play size={20} /> : <Pause size={20} />}
            </button>
          </div>
        </header>

        <section className="claw-intro">
          <div>
            <h1>Ashlife Swing & Win</h1>
            <p>Position, drop, grab, build momentum, then release at the perfect moment.</p>
          </div>
          <div className="claw-mode-panel" aria-label="Game mode and difficulty">
            <div className="claw-segmented">
              {modeOptions.map((option) => (
                <button
                  type="button"
                  className={mode === option.key ? 'selected' : ''}
                  key={option.key}
                  disabled={
                    controlLocks.mode ||
                    (option.key === 'classic' && !classicAvailable)
                  }
                  onClick={() => handleModeChange(option.key)}
                >
                  <strong>{option.label}</strong>
                  <span>
                    {option.key === 'classic' && !classicAvailable
                      ? 'Completed today'
                      : option.note}
                  </span>
                </button>
              ))}
            </div>
            <div className="claw-segmented compact">
              {difficultyOptions.map((option) => (
                <button
                  type="button"
                  className={difficulty === option.key ? 'selected' : ''}
                  key={option.key}
                  disabled={controlLocks.difficulty}
                  onClick={() => handleDifficultyChange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <GameHUD
          status={status}
          coins={summary.coins}
          onRestart={controlApi.onRestart}
          restartDisabled={controlLocks.restart}
        />

        <section className="claw-game-layout">
          <ClawMachineGame
            mode={mode}
            difficulty={difficulty}
            testMode={testMode}
            onEvent={handleEvent}
            registerControls={setControls}
          />
          <MobileControls
            layout={controlLayout}
            onMove={controlApi.onMove}
            onDropGrab={controlApi.onDropGrab}
            onRelease={controlApi.onRelease}
          />
          <aside className="claw-side-panel">
            <LiveGameStats status={status} />
            <SessionCard mode={mode} entries={sessionEntries} />
            <h2>Controls</h2>
            <dl>
              <div>
                <dt>Move</dt>
                <dd>Arrow keys or A / D</dd>
              </div>
              <div>
                <dt>Drop / Grab</dt>
                <dd>Space</dd>
              </div>
              <div>
                <dt>Release</dt>
                <dd>R</dd>
              </div>
              <div>
                <dt>Pause</dt>
                <dd>Esc or P</dd>
              </div>
            </dl>
            <button className="playroom-button secondary" type="button" onClick={handleControlLayoutChange}>
              {controlLayout === 'right' ? 'Right-handed controls' : 'Left-handed controls'}
            </button>
            <button className="playroom-button quiet" type="button" onClick={() => navigate('/shop')}>
              Explore Related Products
            </button>
          </aside>
        </section>
      </div>

      <TutorialOverlay open={showTutorial} onClose={closeTutorial} />
      <SessionSummaryModal
        summary={sessionSummary}
        onPlayPractice={playPractice}
        onBackToPlayroom={() => navigate('/play/')}
      />
    </main>
  );
};

export default AshlifeClawMachinePage;
