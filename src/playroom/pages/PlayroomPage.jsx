import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BellOff,
  BookOpen,
  Clapperboard,
  Coins,
  Gamepad2,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import CompletionModal from '../components/CompletionModal';
import DailyChallengeCard from '../components/DailyChallengeCard';
import GameHeader from '../components/GameHeader';
import MemoryGrid from '../components/MemoryGrid';
import StickerAlbum from '../components/StickerAlbum';
import TutorialModal from '../components/TutorialModal';
import { stickers } from '../data/stickers';
import { getDailyChallenge } from '../games/memory-match/dailyChallenge';
import { difficultySettings, formatTime } from '../games/memory-match/scoring';
import { useLanguage } from '../../context/LanguageContext';
import { useMemoryGame } from '../hooks/useMemoryGame';
import { usePlayroomProgress } from '../hooks/usePlayroomProgress';
import { usePlayroomSound } from '../hooks/usePlayroomSound';
import '../styles/playroom.css';

const mascotSrc = `${import.meta.env.BASE_URL}assets/game/playroom-mascot.webp`;

const playroomCopy = {
  en: {
    backToShop: 'Back to Shop',
    soundOn: 'Turn sound off',
    soundOff: 'Turn sound on',
    reduceMotion: 'Reduce animation',
    resetProgress: 'Reset progress',
    resetConfirm: 'Reset Joy Coins, records and sticker collection? This cannot be undone.',
    heroPill: 'Ashlife Playroom',
    heroTitle: 'Ashlife Playroom',
    heroDescription: 'Play cute mini-games, match adorable stickers and collect rewards.',
    joyCoins: 'Joy Coins',
    collectionPill: 'Sticker album',
    collectionTitle: '{count} / {total} unlocked',
    collectionDescription: 'Collect common stickers from completions and rarer stickers from daily challenges.',
    viewAlbum: 'View Album',
    firstGame: 'First game',
    memoryTitle: 'Product Memory Match',
    clawTitle: 'Ashlife Swing & Win',
    clawDescription: 'Grab a prize, build momentum and swing it into the prize hole!',
    clawButton: 'Play Now',
    clawDifficulty: 'Skill-based',
    clawReward: 'Joy Coins and collectible stickers',
    badgeStudioPill: 'Create and print',
    badgeStudioTitle: 'Badge Studio',
    badgeStudioDescription: 'Upload your photos, design 58 mm badges and build a print-ready A4 sheet.',
    badgeStudioButton: 'Start Designing',
    badgeStudioMeta: 'Free browser tool',
    badgeStudioOutput: '300 DPI A4 export',
    selectMode: 'Select a mode before the game starts.',
    matchTitle: 'Match Ashlife product stickers',
    matchDescription: 'Flip pastel cards, find every pair, earn Joy Coins and unlock sticker rewards.',
    startGame: 'Start Game',
    howToPlay: 'How to Play',
    comingSoon: 'Coming Soon',
    backToPlayroom: 'Back to Playroom',
    pairsMatched: '{matched} / {total} pairs matched',
    best: 'Best',
    time: 'Time',
    hint: 'Hint',
    restart: 'Restart game',
    modeLabel: '{mode} mode',
    gridLabel: 'Product Memory Match card grid',
    hiddenCard: 'Hidden memory card',
    cardLabel: '{name} card',
    difficulty: {
      easy: 'Easy',
      normal: 'Normal',
      hard: 'Hard',
    },
    pairCount: '{count} pairs',
    games: ['DIY Keychain Designer', 'Shopkeeper Rush', 'Mystery Box Adventure'],
    challengeTitles: {
      'easy-finish': 'Complete one Easy game.',
      'normal-30-moves': 'Complete Normal mode in 30 moves or fewer.',
      'normal-fast': 'Finish Normal mode within 2 minutes.',
      'hard-finish': 'Finish Hard mode.',
      'no-hint': 'Complete a game without using a hint.',
    },
    daily: {
      pill: 'Daily challenge',
      reward: 'Bonus {coins} Joy Coins and one {rarity} sticker.',
      claimed: 'Claimed today',
      ready: 'Ready today',
    },
    album: {
      dialogLabel: 'Sticker collection album',
      pill: 'Collection album',
      title: 'Sticker Collection',
      mystery: 'Mystery Sticker',
      unlocked: 'Unlocked',
      explore: 'Explore',
    },
    tutorial: {
      dialogLabel: 'How to play tutorial',
      pill: 'How to play',
      gotIt: 'Got it',
      steps: [
        'Tap a card to reveal a sticker.',
        'Find another card with the same sticker.',
        'Match all pairs using as few moves as possible.',
        'Complete daily challenges to unlock collectible stickers.',
      ],
    },
    completion: {
      dialogLabel: 'Game completion results',
      completePill: 'Memory Match complete',
      heading: 'Well Done!',
      difficulty: 'Difficulty',
      time: 'Time',
      moves: 'Moves',
      score: 'Score',
      coinsEarned: 'Joy Coins earned',
      albumFull: 'Album full',
      newSticker: 'New sticker',
      dailyUnlocked: 'Daily reward unlocked: {sticker} and {coins} bonus coins.',
      dailyAlreadyClaimed: 'Daily challenge complete. Reward was already claimed today.',
      dailyChallenge: 'Daily challenge',
      playAgain: 'Play Again',
      changeDifficulty: 'Change Difficulty',
      viewAlbum: 'View Sticker Album',
      exploreProducts: 'Explore Related Products',
      backToPlayroom: 'Back to Playroom',
      returnToShop: 'Return to Shop',
    },
    rarity: {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      special: 'Special',
    },
    categories: {
      Stationery: 'Stationery',
      'DIY Crafts': 'DIY Crafts',
      'Cute Gifts': 'Cute Gifts',
      'Drinks and Lifestyle': 'Drinks and Lifestyle',
      'Animal Friends': 'Animal Friends',
      'Rare Stickers': 'Rare Stickers',
    },
    productCategories: {
      Stationery: 'Stationery',
      'DIY Crafts': 'DIY Products',
      'Cute Accessories': 'Cute Gifts',
      'Lifestyle Items': 'Lifestyle Items',
    },
    stickerNames: {
      'bear-notebook': 'Bear Notebook',
      'bunny-pencil-case': 'Bunny Pencil Case',
      'cream-glue-set': 'Cream Glue Set',
      'diy-resin-jar': 'DIY Resin Jar',
      'resin-letter-set': 'Resin Letter Set',
      'paw-squishy': 'Paw Squishy',
      'kawaii-washi-tape': 'Kawaii Washi Tape',
      'sticky-notes-set': 'Sticky Notes Set',
      'bunny-scissors': 'Bunny Scissors',
      'bear-pencil-holder': 'Bear Pencil Holder',
      'bubble-tea-keychain': 'Bubble Tea Keychain',
      'puppy-calendar': 'Puppy Calendar',
      'cat-reading': 'Cat Notebook',
      'puppy-teacup': 'Puppy Teacup',
      'bear-heart': 'Heart Keychain',
    },
  },
  zh: {
    backToShop: '返回商店',
    soundOn: '关闭声音',
    soundOff: '开启声音',
    reduceMotion: '减少动画',
    resetProgress: '重置进度',
    resetConfirm: '确定要重置 Joy Coins、纪录和贴纸收藏吗？此操作无法还原。',
    heroPill: 'Ashlife 游戏房',
    heroTitle: 'Ashlife 游戏房',
    heroDescription: '玩可爱的小游戏，配对萌萌贴纸，收集奖励。',
    joyCoins: 'Joy Coins',
    collectionPill: '贴纸图鉴',
    collectionTitle: '已解锁 {count} / {total}',
    collectionDescription: '通关可获得普通贴纸，完成每日挑战可获得更稀有的贴纸。',
    viewAlbum: '查看图鉴',
    firstGame: '第一个游戏',
    memoryTitle: '商品记忆配对',
    clawTitle: 'Ashlife Swing & Win',
    clawDescription: 'Grab a prize, build momentum and swing it into the prize hole!',
    clawButton: 'Play Now',
    clawDifficulty: 'Skill-based',
    clawReward: 'Joy Coins and collectible stickers',
    badgeStudioPill: '创作与打印',
    badgeStudioTitle: '徽章设计室',
    badgeStudioDescription: '上传照片，设计 58 毫米徽章，并自动排版成可打印的 A4 文件。',
    badgeStudioButton: '开始设计',
    badgeStudioMeta: '免费浏览器工具',
    badgeStudioOutput: '300 DPI A4 输出',
    selectMode: '开始前请选择难度。',
    matchTitle: '配对 Ashlife 商品贴纸',
    matchDescription: '翻开粉彩卡牌，找出所有相同贴纸，赚取 Joy Coins 并解锁收藏。',
    startGame: '开始游戏',
    howToPlay: '玩法说明',
    comingSoon: '即将推出',
    backToPlayroom: '返回游戏房',
    pairsMatched: '已配对 {matched} / {total} 组',
    best: '最高分',
    time: '时间',
    hint: '提示',
    restart: '重新开始',
    modeLabel: '{mode}模式',
    gridLabel: '商品记忆配对卡牌区',
    hiddenCard: '隐藏的记忆卡牌',
    cardLabel: '{name} 卡牌',
    difficulty: {
      easy: '简单',
      normal: '普通',
      hard: '困难',
    },
    pairCount: '{count} 组',
    games: ['DIY 钥匙扣设计师', '店长冲刺', '神秘盒冒险'],
    challengeTitles: {
      'easy-finish': '完成一局简单模式。',
      'normal-30-moves': '用 30 步或更少完成普通模式。',
      'normal-fast': '在 2 分钟内完成普通模式。',
      'hard-finish': '完成困难模式。',
      'no-hint': '不使用提示完成一局游戏。',
    },
    daily: {
      pill: '每日挑战',
      reward: '奖励 {coins} Joy Coins 和 1 张{rarity}贴纸。',
      claimed: '今日已领取',
      ready: '今日可挑战',
    },
    album: {
      dialogLabel: '贴纸收藏图鉴',
      pill: '收藏图鉴',
      title: '贴纸收藏',
      mystery: '神秘贴纸',
      unlocked: '解锁日期',
      explore: '逛逛',
    },
    tutorial: {
      dialogLabel: '玩法说明',
      pill: '玩法说明',
      gotIt: '知道了',
      steps: [
        '点击一张卡牌来翻开贴纸。',
        '再找一张相同的贴纸卡牌。',
        '用尽量少的步数配对所有卡牌。',
        '完成每日挑战可以解锁收藏贴纸。',
      ],
    },
    completion: {
      dialogLabel: '游戏完成结果',
      completePill: '记忆配对完成',
      heading: '太棒啦！',
      difficulty: '难度',
      time: '时间',
      moves: '步数',
      score: '分数',
      coinsEarned: '获得 Joy Coins',
      albumFull: '图鉴已满',
      newSticker: '新贴纸',
      dailyUnlocked: '每日奖励已解锁：{sticker} 和 {coins} 枚奖励金币。',
      dailyAlreadyClaimed: '每日挑战完成。今日奖励已经领取过了。',
      dailyChallenge: '每日挑战',
      playAgain: '再玩一次',
      changeDifficulty: '更换难度',
      viewAlbum: '查看贴纸图鉴',
      exploreProducts: '探索相关商品',
      backToPlayroom: '返回游戏房',
      returnToShop: '返回商店',
    },
    rarity: {
      common: '普通',
      uncommon: '少见',
      rare: '稀有',
      special: '特别',
    },
    categories: {
      Stationery: '文具',
      'DIY Crafts': 'DIY 手作',
      'Cute Gifts': '可爱礼物',
      'Drinks and Lifestyle': '饮品与生活',
      'Animal Friends': '动物朋友',
      'Rare Stickers': '稀有贴纸',
    },
    productCategories: {
      Stationery: '文具',
      'DIY Crafts': 'DIY 商品',
      'Cute Accessories': '可爱礼物',
      'Lifestyle Items': '生活商品',
    },
    stickerNames: {
      'bear-notebook': '小熊笔记本',
      'bunny-pencil-case': '兔兔笔袋',
      'cream-glue-set': '奶油胶套装',
      'diy-resin-jar': 'DIY 树脂瓶',
      'resin-letter-set': '树脂字母套装',
      'paw-squishy': '肉球捏捏',
      'kawaii-washi-tape': '可爱和纸胶带',
      'sticky-notes-set': '便利贴套装',
      'bunny-scissors': '兔兔剪刀',
      'bear-pencil-holder': '小熊笔筒',
      'bubble-tea-keychain': '奶茶钥匙扣',
      'puppy-calendar': '小狗台历',
      'cat-reading': '猫咪笔记本',
      'puppy-teacup': '茶杯小狗',
      'bear-heart': '爱心钥匙扣',
    },
  },
};

const DifficultySelector = ({ selected, labels, onSelect }) => (
  <div className="difficulty-selector" aria-label={labels.selectMode}>
    {Object.entries(difficultySettings).map(([key, settings]) => (
      <button
        type="button"
        className={selected === key ? 'selected' : ''}
        key={key}
        onClick={() => onSelect(key)}
      >
        <strong>{labels.difficulty[key]}</strong>
        <span>{labels.pairCount.replace('{count}', settings.pairs)}</span>
      </button>
    ))}
  </div>
);

const PlayroomPage = () => {
  const { language } = useLanguage();
  const labels = playroomCopy[language] || playroomCopy.en;
  const progressActions = usePlayroomProgress();
  const { progress, summary, resetProgress, updateSettings } = progressActions;
  const [view, setView] = useState('landing');
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [showAlbum, setShowAlbum] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !progress.settings.tutorialCompleted);
  const sound = usePlayroomSound(progress.settings.soundEnabled);
  const game = useMemoryGame({ progress, progressActions, sound, initialDifficulty: selectedDifficulty });
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);
  const collectionPercent = Math.round((summary.unlockedCount / stickers.length) * 100);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reduceMotion = progress.settings.reduceMotion || prefersReducedMotion;

  const startMemoryMatch = () => {
    game.startGame(selectedDifficulty);
    setView('game');
  };

  const closeTutorial = () => {
    updateSettings({ tutorialCompleted: true });
    setShowTutorial(false);
  };

  const handleResetProgress = () => {
    const confirmed = window.confirm(labels.resetConfirm);
    if (confirmed) {
      resetProgress();
      setShowAlbum(false);
      setShowTutorial(true);
    }
  };

  const toggleSound = () => {
    updateSettings((settings) => ({ soundEnabled: !settings.soundEnabled }));
  };

  const toggleReduceMotion = () => {
    updateSettings((settings) => ({ reduceMotion: !settings.reduceMotion }));
  };

  return (
    <main className="page playroom-page animate-fade-in">
      <div className="playroom-shell">
        <div className="playroom-topbar">
          <Link className="playroom-back-link" to="/">
            <ArrowLeft size={18} />
            {labels.backToShop}
          </Link>
          <div className="playroom-controls">
            <button
              className="playroom-icon-button"
              type="button"
              onClick={toggleSound}
              aria-label={progress.settings.soundEnabled ? labels.soundOn : labels.soundOff}
            >
              {progress.settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              className="playroom-icon-button"
              type="button"
              onClick={toggleReduceMotion}
              aria-label={labels.reduceMotion}
              title={labels.reduceMotion}
            >
              <BellOff size={20} />
            </button>
            <button className="playroom-icon-button" type="button" onClick={handleResetProgress} aria-label={labels.resetProgress}>
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {view === 'landing' ? (
          <>
            <section className="playroom-hero">
              <div className="playroom-hero-copy">
                <span className="playroom-pill">{labels.heroPill}</span>
                <h1>{labels.heroTitle}</h1>
                <p>{labels.heroDescription}</p>
                <div className="joy-balance-card" aria-label={labels.joyCoins}>
                  <Coins size={24} />
                  <div>
                    <strong>{summary.coins}</strong>
                    <span>{labels.joyCoins}</span>
                  </div>
                </div>
              </div>
              <img src={mascotSrc} alt={labels.heroTitle} />
            </section>

            <section className="playroom-dashboard-grid">
              <DailyChallengeCard challenge={dailyChallenge} progress={progress} labels={labels} />

              <article className="collection-progress-card">
                <div>
                  <span className="playroom-pill">{labels.collectionPill}</span>
                  <h2>{labels.collectionTitle.replace('{count}', summary.unlockedCount).replace('{total}', stickers.length)}</h2>
                  <p>{labels.collectionDescription}</p>
                </div>
                <div className="collection-meter" aria-label={`${collectionPercent}% sticker collection progress`}>
                  <span style={{ width: `${collectionPercent}%` }} />
                </div>
                <button className="playroom-button secondary" type="button" onClick={() => setShowAlbum(true)}>
                  <BookOpen size={18} />
                  {labels.viewAlbum}
                </button>
              </article>
            </section>

            <section className="playroom-games-section">
              <div className="playroom-section-heading">
                <span className="playroom-pill">{labels.firstGame}</span>
                <h2>{labels.clawTitle}</h2>
                <p>{labels.clawDescription}</p>
              </div>

              <article className="claw-feature-card">
                <div className="claw-feature-preview">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/playroom/claw-machine/card/claw-machine-preview-v2.jpg`}
                    alt="Pastel ASHLIFE claw machine filled with cute plush prizes"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="memory-game-copy">
                  <Gamepad2 size={28} />
                  <h3>{labels.clawTitle}</h3>
                  <p>{labels.clawDescription}</p>
                  <div className="claw-card-meta">
                    <span>{labels.clawDifficulty}</span>
                    <span>{labels.clawReward}</span>
                  </div>
                  <Link className="playroom-button primary" to="/play/claw-machine/">
                    <Sparkles size={18} />
                    {labels.clawButton}
                  </Link>
                </div>
              </article>

              <div className="playroom-section-heading secondary-game-heading">
                <span className="playroom-pill">{labels.memoryTitle}</span>
                <p>{labels.selectMode}</p>
              </div>

              <article className="memory-game-card">
                <div className="memory-game-preview">
                  {stickers.slice(0, 6).map((sticker) => (
                    <img key={sticker.id} src={sticker.image} alt="" loading="lazy" />
                  ))}
                </div>
                <div className="memory-game-copy">
                  <Gamepad2 size={28} />
                  <h3>{labels.matchTitle}</h3>
                  <p>{labels.matchDescription}</p>
                  <DifficultySelector selected={selectedDifficulty} labels={labels} onSelect={setSelectedDifficulty} />
                  <div className="memory-game-actions">
                    <button className="playroom-button primary" type="button" onClick={startMemoryMatch}>
                      <Sparkles size={18} />
                      {labels.startGame}
                    </button>
                    <button className="playroom-button secondary" type="button" onClick={() => setShowTutorial(true)}>
                      {labels.howToPlay}
                    </button>
                  </div>
                </div>
              </article>

              <div className="coming-soon-grid" aria-label={labels.comingSoon}>
                {labels.games.map((gameTitle) => (
                  <article className="coming-soon-card" key={gameTitle}>
                    <Clapperboard size={22} />
                    <h3>{gameTitle}</h3>
                    <span>{labels.comingSoon}</span>
                  </article>
                ))}
              </div>

              <div className="playroom-section-heading badge-studio-section-heading">
                <span className="playroom-pill">{labels.badgeStudioPill}</span>
                <h2>{labels.badgeStudioTitle}</h2>
                <p>{labels.badgeStudioDescription}</p>
              </div>

              <article className="badge-studio-feature-card">
                <div className="badge-studio-feature-preview">
                  <img
                    src={`${import.meta.env.BASE_URL}diy/badge-display-1.webp`}
                    alt="A display collection of custom Ashlife badges"
                    loading="lazy"
                    decoding="async"
                  />
                  <span>58 mm</span>
                </div>
                <div className="memory-game-copy">
                  <Sparkles size={28} />
                  <h3>{labels.badgeStudioTitle}</h3>
                  <p>{labels.badgeStudioDescription}</p>
                  <div className="claw-card-meta">
                    <span>{labels.badgeStudioMeta}</span>
                    <span>{labels.badgeStudioOutput}</span>
                  </div>
                  <Link className="playroom-button primary" to="/play/badge-studio/">
                    <Sparkles size={18} />
                    {labels.badgeStudioButton}
                  </Link>
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="memory-match-screen">
            <div className="memory-screen-toolbar">
              <button className="playroom-button quiet" type="button" onClick={() => setView('landing')}>
                <ArrowLeft size={18} />
                {labels.backToPlayroom}
              </button>
              <DifficultySelector
                selected={game.difficulty}
                labels={labels}
                onSelect={(nextDifficulty) => {
                  setSelectedDifficulty(nextDifficulty);
                  game.changeDifficulty(nextDifficulty);
                }}
              />
            </div>

            <GameHeader
              game={game}
              coins={summary.coins}
              labels={labels}
              onHint={game.useHint}
              onRestart={() => game.startGame(game.difficulty)}
            />

            <div className="game-progress-line">
              <span>{labels.pairsMatched.replace('{matched}', game.matchedPairs).replace('{total}', game.settings.pairs)}</span>
              <span>{labels.best}: {progress.records[game.difficulty]?.bestScore || 0}</span>
              <span>{labels.time}: {formatTime(game.elapsedSeconds)}</span>
            </div>

            <MemoryGrid
              cards={game.cards}
              difficulty={game.difficulty}
              selectedIds={game.selectedIds}
              isHinting={game.isHinting}
              reduceMotion={reduceMotion}
              labels={labels}
              onChoose={game.chooseCard}
            />
          </section>
        )}

        <p className="sr-only" aria-live="polite">
          {game.statusMessage}
        </p>
      </div>

      {showAlbum && <StickerAlbum progress={progress} labels={labels} onClose={() => setShowAlbum(false)} />}
      {showTutorial && <TutorialModal labels={labels} onClose={closeTutorial} />}
      <CompletionModal
        completion={game.completion}
        labels={labels}
        onPlayAgain={() => game.startGame(game.difficulty)}
        onChangeDifficulty={() => {
          game.dismissCompletion();
          setView('landing');
        }}
        onViewAlbum={() => setShowAlbum(true)}
        onBackToPlayroom={() => {
          game.dismissCompletion();
          setView('landing');
        }}
      />
    </main>
  );
};

export default PlayroomPage;
