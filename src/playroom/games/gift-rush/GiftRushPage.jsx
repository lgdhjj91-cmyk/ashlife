import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Sparkles, Trophy, RotateCcw, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useJoyWallet } from '../../../context/JoyWalletContext';
import { usePlayroomProgress } from '../../hooks/usePlayroomProgress';
import { usePlayroomSound } from '../../hooks/usePlayroomSound';
import { getLocalDateKey } from '../../utils/dateKey.js';
import { getGiftRushCopy } from './giftRushCopy.js';
import { getGiftRushDailyChallenge, evaluateGiftRushChallenge } from './data/dailyChallenges.js';
import { prepareGiftRushClaim, confirmGiftRushClaim, getGiftRushRewardStatus, giftRushClaimId } from './storage/giftRushProgress.js';
import { createGiftRushClaimRunner } from './systems/rewardClaims.js';
import { useGiftRushGame } from './hooks/useGiftRushGame.js';
import { GiftSprite } from './components/GiftArt.jsx';
import CustomerQueue from './components/CustomerQueue.jsx';
import PackingCounter from './components/PackingCounter.jsx';
import GiftRushHUD from './components/GiftRushHUD.jsx';
import GiftRushDialog from './components/GiftRushDialogs.jsx';
import './styles/gift-rush.css';

const GiftRushPage = () => {
  const { language } = useLanguage();
  const copy = getGiftRushCopy(language);
  const { user, loading: walletLoading } = useJoyWallet();
  const ownerUid = user?.uid || null;
  const { progress, updateProgress, updateSettings, syncCoinReward } = usePlayroomProgress();
  const sound = usePlayroomSound(progress.settings.soundEnabled);
  const game = useGiftRushGame({ updateProgress, ownerUid, playSound: sound.play });
  const { state } = game;
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => progress.giftRush.selectedMode);
  const [dialog, setDialog] = useState(null);
  const [tutorialStartsGame, setTutorialStartsGame] = useState(false);
  const [ownedStickerAtStart, setOwnedStickerAtStart] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [rewardMessage, setRewardMessage] = useState('');
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const uidRef = useRef(ownerUid);
  const mounted = useRef(false);
  const attempted = useRef(new Set());
  const runnerRef = useRef(null);
  useEffect(() => { uidRef.current = ownerUid; }, [ownerUid]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = event => setSystemReducedMotion(event.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const pendingClaims = progress.giftRush.pendingRewardClaims;
  useEffect(() => {
    if (walletLoading || !ownerUid) return;
    if (!runnerRef.current) runnerRef.current = createGiftRushClaimRunner({
      awardCoins: syncCoinReward, getCurrentUid: () => uidRef.current,
    });
    for (const claim of Object.values(pendingClaims)) {
      if (claim.ownerUid !== ownerUid) continue;
      const claimId = giftRushClaimId(claim.dateKey);
      const key = ownerUid + ':' + claimId + ':' + retryToken;
      if (attempted.current.has(key)) continue;
      attempted.current.add(key);
      void runnerRef.current.attempt(claimId, claim).then(result => {
        if (!mounted.current || uidRef.current !== result.ownerUid) return;
        if (result.status === 'credited') {
          updateProgress(current => confirmGiftRushClaim(current, result));
          setRewardMessage('credited');
        } else setRewardMessage(result.status);
      });
    }
  }, [pendingClaims, ownerUid, walletLoading, syncCoinReward, retryToken, updateProgress]);

  const dateKey = state.sessionId ? state.dateKey : getLocalDateKey();
  const challenge = getGiftRushDailyChallenge(dateKey);
  const challengeProgress = evaluateGiftRushChallenge(challenge, state.stats);
  const dailyRewardStatus = getGiftRushRewardStatus(progress.giftRush, dateKey, ownerUid);
  const otherWalletPending = Object.values(pendingClaims).some(claim => claim.dateKey === dateKey && claim.ownerUid && claim.ownerUid !== ownerUid);
  const active = ['running', 'paused'].includes(state.status);
  const activeDialog = dialog || (state.status === 'paused' ? 'pause' : state.status === 'finished' ? 'results' : null);
  const start = () => {
    setOwnedStickerAtStart(progress.unlockedStickers.includes('gift-rush-happy-parcel'));
    setRewardMessage('');
    if (!progress.giftRush.tutorialCompleted) {
      setTutorialStartsGame(true);
      setDialog('tutorial');
    } else game.startRound(mode);
  };
  const finishTutorial = () => {
    updateProgress(current => ({ ...current, giftRush: { ...current.giftRush, tutorialCompleted: true } }));
    setDialog(null);
    if (tutorialStartsGame) game.startRound(mode);
  };
  const howToPlay = () => {
    if (active) game.pause();
    setTutorialStartsGame(false);
    setDialog('tutorial');
  };
  const { resume, abandonRound } = game;
  const closeDialog = useCallback(() => {
    if (dialog) setDialog(null);
    else if (state.status === 'paused') resume();
    else if (state.status === 'finished') abandonRound();
  }, [dialog, state.status, resume, abandonRound]);
  const claimReward = claimDate => {
    if (!ownerUid || walletLoading) return;
    updateProgress(current => prepareGiftRushClaim(current, { dateKey: claimDate, ownerUid }).nextProgress);
    setRewardMessage('');
    setRetryToken(current => current + 1);
  };
  const back = event => {
    if (!active) return;
    event.preventDefault(); game.pause(); setDialog('leave');
  };
  const lastEvent = state.lastEvent;
  const showFeedback = lastEvent && state.elapsedMs - lastEvent.atMs < 1800 && ['delivered', 'wrong', 'expired'].includes(lastEvent.type);
  const feedbackText = lastEvent?.type === 'delivered' ? (lastEvent.perfect ? copy.perfectDelivery : copy.delivery)
    : lastEvent?.type === 'wrong' ? (lastEvent.reason === 'wrap' ? copy.wrongWrap : copy.wrongItems) : copy.expired;
  const claimDisabled = walletLoading || !ownerUid;
  const rewardText = state.mode !== 'daily' ? copy.practiceReward
    : dailyRewardStatus === 'credited' ? copy.rewardCredited
    : dailyRewardStatus === 'pending' ? copy.rewardPending : otherWalletPending ? copy.walletChanged : copy.rewardIncomplete;
  return <main className={'page gift-rush-page ' + (active ? 'gift-is-playing ' : '') + (progress.settings.reduceMotion || systemReducedMotion ? 'gift-reduced-motion' : '')}>
    <div className="gift-shell">
      <div className="gift-topbar">
        <Link to="/play/" onClick={back}><ArrowLeft size={17} />{copy.back}</Link>
        <div><button type="button" className="gift-icon" onClick={howToPlay} aria-label={copy.tutorial}><HelpCircle size={21} /></button>
          {active ? <button type="button" className="gift-icon" aria-label={copy.restart} onClick={() => { game.pause(); setDialog('restart'); }}><RotateCcw size={19} /></button> : null}
        </div>
      </div>
      <header className={'gift-heading ' + (state.status === 'idle' ? 'gift-heading-setup' : '')}>
        <span>{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.description}</p>
      </header>
      {state.status === 'idle' ? <section className="gift-setup">
        <div className="gift-shop-scene"><div className="gift-awning" /><div className="gift-shop-sign">ASHLIFE <span>{copy.counterSign}</span></div>
          <div className="gift-shop-customers">{['bear', 'bunny', 'chick'].map(id => <GiftSprite key={id} customerId={id} expression={id === 'bunny' ? 'happy' : 'waiting'} label={copy.customers[id]} />)}</div>
          <div className="gift-shop-counter"><span>♡</span><Gift size={36} /><span>♡</span></div>
          <div className="gift-scene-caption">{copy.stickerHint}</div>
        </div>
        <div className="gift-setup-copy"><span className="gift-section-label">{copy.setupLabel}</span><h2>{copy.chooseMode}</h2><p>{copy.modeHint}</p>
          <div className="gift-mode-options">{['practice', 'daily'].map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>
            <span>{value === 'daily' ? <Sparkles size={20} /> : <Gift size={20} />}<strong>{copy[value]}</strong></span><small>{copy[value + 'Note']}</small>
          </button>)}</div>
          {mode === 'daily' ? <div className="gift-daily-note"><strong>{copy.goal}</strong><p>{copy.dailyGoals[challenge.id]}</p>{dailyRewardStatus === 'credited' ? <small>{copy.rewardAlready}</small> : null}</div> : null}
          <button type="button" className="gift-primary gift-start" onClick={start}><Gift size={20} />{copy.start}</button>
          <div className="gift-personal-best"><Trophy size={17} />{copy.best}: <strong>{progress.giftRush.bestScore.toLocaleString()}</strong></div>
        </div>
      </section> : <section className="gift-game-board" aria-label={copy.title}>
        <div className="gift-counter-heading"><span>ASHLIFE</span><span>{copy.giftFor} ♡</span></div>
        <GiftRushHUD state={state} copy={copy} challenge={challenge} challengeProgress={challengeProgress}
          soundEnabled={progress.settings.soundEnabled} onSound={() => updateSettings({ soundEnabled: !progress.settings.soundEnabled })} onPause={game.pause} />
        <CustomerQueue state={state} copy={copy} dispatch={game.dispatch} />
        <div className={'gift-feedback ' + (showFeedback ? 'visible ' + lastEvent.type : '')} role="status" aria-live="polite">
          {showFeedback ? <><GiftSprite customerId={lastEvent.customerId} expression={lastEvent.type === 'delivered' ? 'happy' : 'disappointed'} label={copy.customers[lastEvent.customerId]} /><span>{feedbackText}</span>{lastEvent.points ? <><Gift key={lastEvent.id} className="gift-dispatch" size={19} aria-hidden="true" /><strong>+{lastEvent.points}</strong></> : null}</> : <span aria-hidden="true">♡</span>}
        </div>
        <PackingCounter state={state} copy={copy} dispatch={game.dispatch} />
      </section>}
      {state.status === 'idle' && Object.keys(pendingClaims).length ? <section className="gift-pending-rewards"><h2>{copy.pendingTitle}</h2>
        {Object.entries(pendingClaims).map(([id, claim]) => <div key={id}><span>{claim.dateKey} · 20 {copy.coins}</span>
          <p>{claim.ownerUid && claim.ownerUid !== ownerUid ? copy.walletChanged : copy.rewardPending}</p>
          <button type="button" className="gift-secondary" disabled={claimDisabled || Boolean(claim.ownerUid && claim.ownerUid !== ownerUid)} onClick={() => claimReward(claim.dateKey)}>{claim.ownerUid ? copy.retry : copy.claim}</button>
        </div>)}
      </section> : null}
      <p className="gift-wallet-status" role="status">{rewardMessage === 'credited' && state.status === 'idle' ? copy.rewardCredited : rewardMessage === 'wallet-changed' ? copy.walletChanged : ''}</p>
    </div>
    {activeDialog ? <GiftRushDialog title={activeDialog === 'tutorial' ? copy.tutorial : activeDialog === 'pause' ? copy.paused : activeDialog === 'leave' ? copy.leaveTitle : activeDialog === 'restart' ? copy.restartTitle : copy.results} copy={copy} onClose={closeDialog}>
      {activeDialog === 'tutorial' ? <><ol className="gift-tutorial">{copy.tutorialSteps.map(step => <li key={step}>{step}</li>)}</ol><button type="button" className="gift-primary" onClick={finishTutorial}>{tutorialStartsGame ? copy.start : copy.close}</button></> : null}
      {activeDialog === 'pause' ? <><GiftSprite customerId="bunny" label={copy.customers.bunny} /><p>{copy.pausedNote}</p><button type="button" className="gift-primary" onClick={game.resume}>{copy.resume}</button></> : null}
      {['leave', 'restart'].includes(activeDialog) ? <><p>{activeDialog === 'leave' ? copy.leaveNote : copy.restartNote}</p><div className="gift-dialog-actions">
        <button type="button" className="gift-secondary" onClick={() => { setDialog(null); game.resume(); }}>{copy.cancel}</button>
        <button type="button" className="gift-primary" onClick={() => { setDialog(null); game.abandonRound(); if (activeDialog === 'leave') navigate('/play/'); else game.startRound(mode); }}>{activeDialog === 'leave' ? copy.leave : copy.confirmRestart}</button>
      </div></> : null}
      {activeDialog === 'results' ? <div className="gift-results">
        <img src={import.meta.env.BASE_URL + 'assets/playroom/gift-rush/rewards/happy-parcel.webp'} width="120" height="120" alt="" className="gift-result-parcel" />
        <p>{copy.resultsNote}</p><div className="gift-result-score"><span>{copy.score}</span><strong>{state.stats.score.toLocaleString()}</strong></div>
        <div className="gift-result-stats">{[[copy.served, state.stats.servedOrders], [copy.perfect, state.stats.perfectOrders], [copy.maxCombo, state.stats.maxCombo]].map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
        <p>{copy.best}: <strong>{progress.giftRush.bestScore.toLocaleString()}</strong></p>
        {state.mode === 'daily' ? <div className="gift-daily-note"><strong>{challengeProgress.complete ? copy.goalDone : copy.goal}</strong><p>{copy.dailyGoals[challenge.id]} ({Math.min(challengeProgress.progress, challenge.target)}/{challenge.target})</p></div> : null}
        <p className="gift-result-reward" role="status">{rewardText}</p>
        {state.mode === 'daily' && dailyRewardStatus === 'pending' ? <>
          <button type="button" className="gift-secondary" disabled={claimDisabled} onClick={() => claimReward(dateKey)}>{pendingClaims[giftRushClaimId(dateKey)] ? copy.claim : copy.retry}</button>
          {claimDisabled ? <small>{copy.walletWait}</small> : null}
        </> : null}
        {state.stats.perfectOrders >= 5 && !ownedStickerAtStart ? <p className="gift-sticker-earned"><Sparkles size={16} />{copy.stickerUnlocked}</p> : null}
        <div className="gift-dialog-actions"><button type="button" className="gift-primary" onClick={() => { setOwnedStickerAtStart(progress.unlockedStickers.includes('gift-rush-happy-parcel')); game.startRound(state.mode); }}>{copy.replay}</button>
          <button type="button" className="gift-secondary" onClick={() => { game.abandonRound(); navigate('/play/'); }}>{copy.back}</button></div>
      </div> : null}
    </GiftRushDialog> : null}
  </main>;
};
export default GiftRushPage;
