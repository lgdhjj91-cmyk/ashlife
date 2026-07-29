const clawFeatureCopy = {
  en: {
    title: 'Ashlife Swing & Win',
    description: 'Grab a prize, build momentum and swing it into the prize hole!',
    button: 'Play Now',
    difficulty: 'Skill-based',
    reward: 'Joy Coins and collectible stickers',
    imageAlt: 'Pastel ASHLIFE claw machine filled with cute plush prizes',
  },
  zh: {
    title: 'Ashlife 摇摆抓奖',
    description: '抓取奖品、制造摇摆动力，在最合适的时机把奖品投进洞口！',
    button: '马上玩',
    difficulty: '技巧挑战',
    reward: '欢乐币和收藏贴纸',
    imageAlt: '装满可爱毛绒奖品的粉彩 ASHLIFE 抓奖机',
  },
};

export function getPlayroomClawFeatureCopy(language) {
  return clawFeatureCopy[language] || clawFeatureCopy.en;
}
