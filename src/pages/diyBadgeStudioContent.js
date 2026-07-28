const badgeStudioPromotion = {
  en: {
    title: 'Design Your Own 58 mm Badge',
    description:
      'Upload your photos, adjust every crop and arrange mixed designs into a print-ready A4 sheet in our free Badge Studio.',
    features: [
      'Adjust every photo yourself',
      'Mix designs and quantities',
      'Create a print-ready A4 layout',
    ],
    cta: 'Design Your 58 mm Badge',
    note: 'No design software needed — works directly in your browser.',
  },
  zh: {
    title: '自己设计 58 mm 徽章',
    description: '上传照片、调整裁切位置，并把不同设计自动排成可打印的 A4 文件。徽章设计室可免费在浏览器中使用。',
    features: [
      '自己调整每一张照片',
      '混合不同设计和数量',
      '自动制作可打印 A4 排版',
    ],
    cta: '开始设计 58 mm 徽章',
    note: '无需安装设计软件，直接在浏览器中完成。',
  },
};

export function getBadgeStudioPromotion(language) {
  return badgeStudioPromotion[language === 'zh' ? 'zh' : 'en'];
}
