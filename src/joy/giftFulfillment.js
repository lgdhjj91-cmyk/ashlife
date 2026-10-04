export const giftFulfillmentCopy = (language = 'en', method) => {
  const zh = language === 'zh';
  if (method === 'pickup') return zh
    ? 'Seri Kembangan 自取：领取时可从该类礼物的现有款式中挑选。'
    : 'Pickup in Seri Kembangan: choose from available designs in your redeemed gift category when collecting.';
  if (method === 'delivery') return zh
    ? '寄送：礼物随机款式，随订单一起寄出。运费照常计算。'
    : 'Delivery: a random gift design is packed with your order. Normal delivery charges apply.';
  return zh
    ? 'Seri Kembangan 自取可挑选现有款式；寄送为随机款式。每单每种礼物限 1 件，送完为止。'
    : 'Choose from available designs at pickup in Seri Kembangan; delivery is a random design. One of each gift per order, while stocks last.';
};
