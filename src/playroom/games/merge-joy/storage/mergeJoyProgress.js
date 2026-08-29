const medalRank = { bronze: 1, silver: 2, gold: 3, perfect: 4 };
const weeklyStickerIds = [
  'merge-weekly-sleepy-bunny',
  'merge-weekly-shopping-bear',
  'merge-weekly-tiny-chick',
  'merge-weekly-rainbow-pencil-case',
  'merge-weekly-golden-star-charm',
];

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const toDateKey = (date) => date.toISOString().slice(0, 10);

const getWeekDetails = (dateKey) => {
  const date = parseDateKey(dateKey);
  const weekday = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - weekday + 1);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday - yearStart) / 86_400_000 + 1) / 7);
  return {
    weekKey: `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`,
    mondayKey: toDateKey(monday),
    week,
  };
};

const getCurrentStreak = (completionDates, dateKey) => {
  const completed = new Set(completionDates);
  const cursor = parseDateKey(dateKey);
  let streak = 0;
  while (completed.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
};

const addSticker = (progress, stickerId, dateKey, unlocked) => {
  if (progress.unlockedStickers.includes(stickerId)) return progress;
  unlocked.push(stickerId);
  return {
    ...progress,
    unlockedStickers: [...progress.unlockedStickers, stickerId],
    stickerUnlockDates: { ...progress.stickerUnlockDates, [stickerId]: dateKey },
  };
};

export const recordMergeDiscovery = (progress, { tier, count = 1, dateKey }) => {
  const safeTier = Math.min(11, Math.max(1, Number(tier) || 1));
  const current = progress.mergeJoy.discoveries?.[safeTier] || { firstDate: '', count: 0 };
  return {
    ...progress,
    mergeJoy: {
      ...progress.mergeJoy,
      highestTier: Math.max(progress.mergeJoy.highestTier || 1, safeTier),
      discoveries: {
        ...progress.mergeJoy.discoveries,
        [safeTier]: {
          firstDate: current.firstDate || dateKey,
          count: current.count + Math.max(0, Number(count) || 0),
        },
      },
    },
  };
};

export const applyMergeSessionResult = (
  progress,
  { mode, dateKey, challengeId = '', dailyResult = null, stats = {} }
) => {
  const unlocked = [];
  let nextProgress = progress;
  Object.entries(stats.createdByTier || {}).forEach(([tier, count]) => {
    if (count > 0) nextProgress = recordMergeDiscovery(nextProgress, { tier, count, dateKey });
  });

  nextProgress = {
    ...nextProgress,
    mergeJoy: {
      ...nextProgress.mergeJoy,
      highestScore: Math.max(nextProgress.mergeJoy.highestScore || 0, Number(stats.score) || 0),
      highestTier: Math.max(nextProgress.mergeJoy.highestTier || 1, Number(stats.highestTier) || 1),
      bestCombo: Math.max(nextProgress.mergeJoy.bestCombo || 0, Number(stats.maxCombo) || 0),
      perfectDrops: (nextProgress.mergeJoy.perfectDrops || 0) + Math.max(0, Number(stats.perfectDrops) || 0),
    },
  };

  if (Number(stats.createdByTier?.[11]) > 0) {
    nextProgress = addSticker(nextProgress, 'merge-golden-bunny', dateKey, unlocked);
  }

  let coinAward = 0;
  if (mode === 'daily' && dailyResult?.complete) {
    const previousDaily = nextProgress.mergeJoy.daily?.date === dateKey
      ? nextProgress.mergeJoy.daily
      : { date: dateKey, completed: false, medal: null, coinsClaimed: 0, challengeId };
    const cappedCoins = Math.min(30, Math.max(0, Number(dailyResult.coins) || 0));
    coinAward = Math.max(0, cappedCoins - (previousDaily.coinsClaimed || 0));
    const completionDates = [...new Set([...(nextProgress.dailyStreak.completionDates || []), dateKey])].sort();
    const rewardedMilestones = [...(nextProgress.dailyStreak.rewardedMilestones || [])];
    const { weekKey, mondayKey, week } = getWeekDetails(dateKey);
    const currentStreak = getCurrentStreak(completionDates, dateKey);
    const weekCompletions = completionDates.filter((date) => date >= mondayKey && date <= dateKey).length;

    if (currentStreak >= 3 && !rewardedMilestones.includes(`${weekKey}:3`)) {
      rewardedMilestones.push(`${weekKey}:3`);
      coinAward += 5;
    }
    if (weekCompletions >= 5 && !rewardedMilestones.includes(`${weekKey}:5`)) {
      rewardedMilestones.push(`${weekKey}:5`);
      nextProgress = addSticker(nextProgress, weeklyStickerIds[week % weeklyStickerIds.length], dateKey, unlocked);
    }
    if (currentStreak >= 7 && !rewardedMilestones.includes(`${weekKey}:7`)) {
      rewardedMilestones.push(`${weekKey}:7`);
      coinAward += 10;
      nextProgress = addSticker(nextProgress, weeklyStickerIds[(week + 1) % weeklyStickerIds.length], dateKey, unlocked);
    }

    nextProgress = {
      ...nextProgress,
      dailyStreak: { completionDates, rewardedMilestones },
      mergeJoy: {
        ...nextProgress.mergeJoy,
        daily: {
          date: dateKey,
          completed: true,
          medal:
            (medalRank[dailyResult.medal] || 0) >= (medalRank[previousDaily.medal] || 0)
              ? dailyResult.medal
              : previousDaily.medal,
          coinsClaimed: Math.max(previousDaily.coinsClaimed || 0, cappedCoins),
          challengeId,
        },
      },
    };
  }

  nextProgress = { ...nextProgress, coins: Math.max(0, nextProgress.coins + coinAward) };
  return { nextProgress, coinAward, stickerIds: unlocked };
};
