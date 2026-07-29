import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
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
import { getClawMachineCopy } from './clawMachineCopy';
import './styles/claw-machine.css';

const createDefaultStatus = (copy) => ({
  state: 'READY',
  statusMessage: copy.status.READY,
  gripStatus: '',
  swingPower: 0,
  attemptsRemaining: copy.unlimited,
  attemptsUsed: 0,
  score: 0,
  elapsedSeconds: 0,
  turnSecondsRemaining: 10,
  classicSessionEnded: false,
});

const AshlifeClawMachinePage = () => {
  const { language } = useLanguage();
  const copy = useMemo(() => getClawMachineCopy(language), [language]);
  const modeOptions = useMemo(
    () => ['practice', 'classic'].map((key) => ({ key, ...copy.modes[key] })),
    [copy]
  );
  const difficultyOptions = useMemo(
    () => ['easy', 'normal', 'hard'].map((key) => ({ key, label: copy.difficulties[key] })),
    [copy]
  );
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
  const [status, setStatus] = useState(() => createDefaultStatus(copy));
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
            {copy.backToPlayroom}
          </Link>
          <div className="claw-topbar-actions">
            <Link className="playroom-button quiet" to="/">
              <Home size={18} />
              {copy.backToShop}
            </Link>
            <button className="playroom-button quiet" type="button" onClick={() => setShowTutorial(true)}>
              {copy.howToPlay}
            </button>
            <button className="playroom-icon-button" type="button" onClick={toggleSound} aria-label={copy.toggleSound}>
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button className="playroom-icon-button" type="button" onClick={togglePause} aria-label={paused ? copy.resumeGame : copy.pauseGame}>
              {paused ? <Play size={20} /> : <Pause size={20} />}
            </button>
          </div>
        </header>

        <section className="claw-intro">
          <div>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
          <div className="claw-mode-panel" aria-label={copy.modePanelAria}>
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
                      ? copy.completedToday
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
          copy={copy.hud}
        />

        <section className="claw-game-layout">
          <ClawMachineGame
            mode={mode}
            difficulty={difficulty}
            language={language}
            copy={copy}
            testMode={testMode}
            onEvent={handleEvent}
            registerControls={setControls}
          />
          <MobileControls
            layout={controlLayout}
            onMove={controlApi.onMove}
            onDropGrab={controlApi.onDropGrab}
            onRelease={controlApi.onRelease}
            copy={copy.mobile}
          />
          <aside className="claw-side-panel">
            <LiveGameStats status={status} copy={copy.hud} />
            <SessionCard mode={mode} entries={sessionEntries} copy={copy.session} prizeNames={copy.prizes} />
            <h2>{copy.controlsTitle}</h2>
            <dl>
              <div>
                <dt>{copy.controls.move}</dt>
                <dd>{copy.controls.moveKeys}</dd>
              </div>
              <div>
                <dt>{copy.controls.dropGrab}</dt>
                <dd>{copy.controls.dropGrabKey}</dd>
              </div>
              <div>
                <dt>{copy.controls.release}</dt>
                <dd>{copy.controls.releaseKey}</dd>
              </div>
              <div>
                <dt>{copy.controls.pause}</dt>
                <dd>{copy.controls.pauseKey}</dd>
              </div>
            </dl>
            <button className="playroom-button secondary" type="button" onClick={handleControlLayoutChange}>
              {controlLayout === 'right' ? copy.controls.rightHanded : copy.controls.leftHanded}
            </button>
            <button className="playroom-button quiet" type="button" onClick={() => navigate('/shop')}>
              {copy.controls.explore}
            </button>
          </aside>
        </section>
      </div>

      <TutorialOverlay open={showTutorial} onClose={closeTutorial} copy={copy.tutorial} />
      <SessionSummaryModal
        summary={sessionSummary}
        onPlayPractice={playPractice}
        onBackToPlayroom={() => navigate('/play/')}
        copy={copy.summary}
        prizeNames={copy.prizes}
      />
    </main>
  );
};

export default AshlifeClawMachinePage;
