import React from 'react';
import { Coins, Sparkles } from 'lucide-react';

const copy = {
  en: {
    heading: 'Choose a game mode',
    endlessTitle: 'ENDLESS PRACTICE',
    endlessReward: 'No Joy Coins',
    dailyTitle: 'DAILY REWARDS',
    dailyReward: 'Earn up to 80 Joy Coins',
  },
  zh: {
    heading: '选择游戏模式',
    endlessTitle: '无限练习',
    endlessReward: '不奖励 Joy Coins',
    dailyTitle: '每日奖励',
    dailyReward: '最多赚取 80 Joy Coins',
  },
};

const MergeModeSelector = ({ language = 'en', mode, onChoose }) => {
  const labels = copy[language] || copy.en;

  return (
    <section className="merge-mode-picker" aria-labelledby="merge-mode-heading">
      <span className="merge-mode-heading" id="merge-mode-heading">{labels.heading}</span>
      <div className="merge-mode-tabs">
        <button
          aria-pressed={mode === 'endless'}
          className={mode === 'endless' ? 'is-selected' : ''}
          type="button"
          onClick={() => onChoose('endless')}
        >
          <Sparkles aria-hidden="true" />
          <span className="merge-mode-option-copy">
            <strong>{labels.endlessTitle}</strong>
            <small>{labels.endlessReward}</small>
          </span>
        </button>
        <button
          aria-pressed={mode === 'daily'}
          className={mode === 'daily' ? 'is-selected' : ''}
          type="button"
          onClick={() => onChoose('daily')}
        >
          <Coins aria-hidden="true" />
          <span className="merge-mode-option-copy">
            <strong>{labels.dailyTitle}</strong>
            <small>{labels.dailyReward}</small>
          </span>
        </button>
      </div>
    </section>
  );
};

export default MergeModeSelector;
