import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, X } from 'lucide-react';
import { useJoyWallet } from '../context/JoyWalletContext';
import { useLanguage } from '../context/LanguageContext';
import { GIFT_TIERS, getVoucherEligibility, rewardName } from '../joy/joyVoucherRules';
import { COZY_GARDEN_URL } from '../joy/gardenPromotion';
import { giftFulfillmentCopy } from '../joy/giftFulfillment';
import { giftImages } from '../joy/joyRewardAssets';
import { resolveAssetUrl } from '../utils/assets';

export default function JoyGiftSelection({ subtotalSen }) {
  const { wallet, selectedGifts, chooseGift, removeGift } = useJoyWallet();
  const { language } = useLanguage();
  const zh = language === 'zh';
  return <div className="joy-checkout-gifts"><h3><Gift size={18} />{zh ? '订单免费礼物' : 'Free gifts with your order'}</h3>
    <p>{zh ? '任意购买，每单每种礼物限 1 件，可搭配 1 张现金优惠券。Joy 和 Garden 的同类礼物代码不能叠加。' : 'Any purchase; one of each gift per order, plus one cash voucher. Joy and Garden codes for the same gift cannot be combined.'}</p>
    <p>{giftFulfillmentCopy(language)}</p>
    {GIFT_TIERS.map((tier) => {
      const selected = selectedGifts.find((reward) => reward.tierId === tier.id);
      const available = wallet.vouchers.filter((reward) => reward.tierId === tier.id && getVoucherEligibility(reward, subtotalSen).eligible);
      return <div className="joy-checkout-gift" key={tier.id}>
        {giftImages[tier.id] ? <img src={resolveAssetUrl(giftImages[tier.id])} alt="" /> : <span className="joy-gift-placeholder" aria-hidden="true"><Gift size={28} /></span>}
        <div><strong>{rewardName(tier, language)}</strong>
          {selected ? <><code>{selected.code}</code><span>{zh ? '免费 1 件 · 结账时确认库存' : '1 free gift · Stock checked at checkout'}</span></> : available.length ? <select aria-label={rewardName(tier, language)} value="" onChange={(event) => { const gift = available.find((reward) => reward.code === event.target.value); if (gift) chooseGift(gift); }}>
            <option value="">{zh ? '选择奖励代码' : 'Choose a reward code'}</option>
            {available.map((reward) => <option value={reward.code} key={reward.code}>{reward.code}</option>)}
          </select> : tier.gardenExclusive ? <><span>{zh ? 'Cozy Garden 专属 · 兑换即将开放' : 'Cozy Garden exclusive · Rewards coming soon'}</span><a href={COZY_GARDEN_URL} target="_blank" rel="noopener noreferrer">{zh ? '探索花园' : 'Explore the garden'} ↗</a></> : <Link to="/joy-coins">{zh ? '500 Joy Coins 兑换' : 'Redeem for 500 Joy Coins'} →</Link>}
        </div>
        {selected && <button type="button" onClick={() => removeGift(selected.code)} aria-label={`${zh ? '移除' : 'Remove'} ${rewardName(tier, language)}`}><X size={17} /></button>}
      </div>;
    })}
  </div>;
}
