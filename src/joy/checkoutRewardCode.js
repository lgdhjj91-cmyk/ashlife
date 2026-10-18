import { isGiftReward, normalizeVoucherCode } from './joyVoucherRules.js';

export const checkoutCodeCopy = {
  en: {
    placeholder: 'CG-KEYCHAIN-… or JOY-RM1-…',
    help: 'Have a Cozy Garden gift code? Copy it from Garden → Ashlife Gifts, paste it here and apply. No linked account is needed. Your free gift appears below and is confirmed when you place the order.',
    giftApplied: 'Gift code applied. Your free gift is shown below; stock is confirmed at checkout.',
    cashApplied: 'Voucher code applied.',
    connection: 'We could not check this code. Check your connection and try again.',
  },
  zh: {
    placeholder: 'CG-KEYCHAIN-… 或 JOY-RM1-…',
    help: '有 Cozy Garden 礼物代码？在花园 → Ashlife Gifts 复制代码，粘贴到这里并套用，无需关联账号。免费礼物会显示在下方，下单时确认库存。',
    giftApplied: '礼物代码已套用。免费礼物显示在下方，结账时确认库存。',
    cashApplied: '优惠券代码已套用。',
    connection: '暂时无法检查代码，请检查网络后重试。',
  },
};

export async function applyCheckoutRewardCode({ code, subtotalSen, preview, chooseGift, chooseVoucher }) {
  try {
    const result = await preview(normalizeVoucherCode(code), subtotalSen);
    if (!result.success || !result.valid || !result.voucher) return result;
    const kind = isGiftReward(result.voucher) ? 'gift' : 'cash';
    if (kind === 'gift') chooseGift(result.voucher);
    else chooseVoucher(result.voucher);
    return { ...result, kind, code: result.voucher.code };
  } catch {
    return { success: false, valid: false, reason: 'connection' };
  }
}
