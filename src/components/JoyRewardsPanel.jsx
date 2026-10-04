import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Check, Coins, Copy, Gift, LogIn, LogOut, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react';
import { useJoyWallet } from '../context/JoyWalletContext';
import { useLanguage } from '../context/LanguageContext';
import { createRedeemedVoucherNotice } from '../joy/joyRedeemNotice';
import { JOY_GIFT_TIERS, JOY_VOUCHER_TIERS, isGiftReward, rewardName } from '../joy/joyVoucherRules';
import { giftImages } from '../joy/joyRewardAssets';
import { handleImageFallback, resolveAssetUrl } from '../utils/assets';
import './JoyRewardsPanel.css';
import CozyGardenFeature from './CozyGardenFeature';
import { giftFulfillmentCopy } from '../joy/giftFulfillment';

const copy = {
  en: {
    eyebrow: 'Joy Rewards',
    title: 'Little games. Real gifts.',
    intro: 'Turn your Joy Coins into gifts and savings. Redeem a gift, then add its code to any purchase.',
    coins: 'Joy Coins',
    redeem: 'Redeem',
    redeeming: 'Redeeming…',
    need: 'Need {count} more coins',
    min: 'Minimum items RM{amount}',
    wallet: 'My rewards',
    empty: 'No rewards yet. Play a game, collect coins, then redeem one here.',
    gifts: 'A little gift with your next order',
    giftTerms: 'Any purchase · No minimum spend · 1 of each gift per order',
    assortment: 'Assorted design, chosen by us. While stocks last.',
    giftUse: 'Receive 1 free gift with any purchase. Add the code at checkout; no minimum spend.',
    cash: 'Save on your next purchase',
    browse: 'Redeem rewards',
    history: 'Coin history',
    historyEmpty: 'Your coin activity will appear here as you play and redeem rewards.',
    historyNote: 'Showing the latest 100 earnings and 100 redemptions. Older rewards remain in My rewards.',
    earned: 'Game reward',
    redeemed: 'Redeemed',
    viewWallet: 'Open Joy Coins wallet',
    copy: 'Copy code',
    copied: 'Copied',
    redeemedEyebrow: 'Reward ready',
    redeemedTitle: 'Reward redeemed!',
    redeemedIntro: 'Your new reward is saved in My rewards, ready for checkout.',
    redeemedAria: 'Redeemed voucher details',
    voucherCode: 'Reward code',
    minimumSpend: 'Minimum item spend {amount}',
    close: 'Close',
    closeDialog: 'Close voucher details',
    available: 'Ready to use',
    reserved: 'Reserved for an order',
    used: 'Used',
    accountTitle: 'Save your wallet on other devices',
    accountIntro: 'Optional only. Shopping and voucher codes always work without signing in.',
    create: 'Create account',
    signIn: 'Sign in',
    email: 'Email address',
    password: 'Password (at least 6 characters)',
    creating: 'Creating…',
    signingIn: 'Signing in…',
    signedIn: 'Wallet saved to',
    signOut: 'Sign out',
    guestNote: 'Creating an account keeps this guest wallet. Signing into an existing account switches to that account’s saved wallet.',
    accountSuccess: 'Your Joy wallet is now saved to your account.',
  },
  zh: {
    eyebrow: 'Joy 奖励',
    title: '玩小游戏，兑换真实礼物',
    intro: '使用 Joy Coins 兑换礼物和购物优惠。兑换礼物后，在任何购物订单中使用代码即可领取。',
    coins: 'Joy Coins',
    redeem: '兑换',
    redeeming: '正在建立优惠券…',
    need: '还需要 {count} 枚金币',
    min: '商品最低消费 RM{amount}',
    wallet: '我的奖励',
    gifts: '下个订单的小礼物',
    giftTerms: '任意购买 · 无最低消费 · 每单每种礼物限 1 件',
    assortment: '款式随机，由我们挑选。送完为止。',
    giftUse: '任意购买即可获赠 1 件礼物。结账时加入代码，无最低消费。',
    cash: '下次购物享优惠',
    browse: '兑换奖励',
    history: '金币记录',
    historyEmpty: '游戏赚取和兑换金币的记录将显示在这里。',
    historyNote: '显示最近 100 条赚取和 100 条兑换记录。更早的奖励仍保留在“我的奖励”中。',
    earned: '游戏奖励',
    redeemed: '已兑换',
    viewWallet: '打开 Joy Coins 钱包',
    empty: '目前还没有优惠券。先玩游戏赚取金币，再回来兑换。',
    copy: '复制代码',
    copied: '已复制',
    redeemedEyebrow: '奖励已准备好',
    redeemedTitle: '奖励兑换成功！',
    redeemedIntro: '新奖励已保存至“我的奖励”，可以在结账时使用。',
    redeemedAria: '已兑换优惠券详情',
    voucherCode: '奖励代码',
    minimumSpend: '商品最低消费 {amount}',
    close: '关闭',
    closeDialog: '关闭优惠券详情',
    available: '可以使用',
    reserved: '已保留给订单',
    used: '已使用',
    accountTitle: '在其他设备保存钱包',
    accountIntro: '完全自愿。无需登录也能购物和使用优惠券代码。',
    create: '建立账号',
    signIn: '登录',
    email: '电邮地址',
    password: '密码（至少 6 个字符）',
    creating: '正在建立…',
    signingIn: '正在登录…',
    signedIn: '钱包已保存至',
    signOut: '退出登录',
    guestNote: '建立账号会保留当前访客钱包。登录已有账号则会切换到该账号保存的钱包。',
    accountSuccess: 'Joy 钱包已成功保存至您的账号。',
  },
};

const formatRm = (sen) => (Number(sen || 0) / 100).toFixed(0);

const JoyRewardsPanel = ({ standalone = false }) => {
  const { language } = useLanguage();
  const labels = copy[language] || copy.en;
  const {
    user,
    isCustomer,
    wallet,
    loadHistory,
    historyLoading,
    historyError,
    loading,
    serviceError,
    redeemVoucher,
    createAccount,
    signInCustomer,
    signOutCustomer,
  } = useJoyWallet();
  const [busyTier, setBusyTier] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [accountMode, setAccountMode] = useState('create');
  const [accountForm, setAccountForm] = useState({ email: '', password: '' });
  const [accountBusy, setAccountBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [redeemedVoucher, setRedeemedVoucher] = useState(null);
  const [tab, setTab] = useState('redeem');
  const [statusFilter, setStatusFilter] = useState('all');
  const visibleRewards = wallet.vouchers.filter((reward) => statusFilter === 'all' || reward.status === statusFilter);
  useEffect(() => { if (tab === 'history') loadHistory?.(); }, [tab, loadHistory]);
  const redeemDialogCloseRef = useRef(null);
  const redeemedNotice = redeemedVoucher
    ? createRedeemedVoucherNotice(redeemedVoucher)
    : null;

  useEffect(() => {
    if (!redeemedVoucher) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeDialog = (event) => {
      if (event.key === 'Escape') setRedeemedVoucher(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeDialog);
    redeemDialogCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeDialog);
    };
  }, [redeemedVoucher]);

  const handleRedeem = async (tierId) => {
    setBusyTier(tierId);
    setNotice('');
    const result = await redeemVoucher(tierId);
    setBusyTier('');
    if (result.success) {
      setRedeemedVoucher(result.voucher);
    } else {
      setNotice(result.error);
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(''), 1800);
    } catch {
      setNotice(code);
    }
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    setAccountBusy(true);
    setNotice('');
    const action = accountMode === 'create' ? createAccount : signInCustomer;
    const result = await action(accountForm.email, accountForm.password);
    setAccountBusy(false);
    setNotice(result.success ? labels.accountSuccess : result.error);
    if (result.success) setAccountForm({ email: '', password: '' });
  };

  const closeRedeemedVoucher = () => {
    setRedeemedVoucher(null);
    setCopiedCode('');
  };

  return (
    <section className="joy-rewards-panel" id="joy-rewards">
      <div className="joy-rewards-heading">
        <div>
          <span className="playroom-pill">{labels.eyebrow}</span>
          <h2>{labels.title}</h2>
          <p>{labels.intro}</p>
        </div>
        <Link to="/joy-coins" className="joy-wallet-balance" aria-label={labels.viewWallet}>
          <Coins size={24} />
          <strong>{loading ? '…' : wallet.coins}</strong>
          <span>{labels.coins}</span>
        </Link>
      </div>

      <div className="joy-wallet-tabs" role="tablist" aria-label={labels.coins}>
        {[['redeem', labels.browse], ['wallet', labels.wallet], ['history', labels.history]].map(([id, label]) => (
          <button type="button" role="tab" id={`joy-tab-${id}`} aria-controls={`joy-panel-${id}`} aria-selected={tab === id} key={id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === 'redeem' && <div role="tabpanel" id="joy-panel-redeem" aria-labelledby="joy-tab-redeem">
      <h3 className="joy-section-title">{labels.gifts}</h3>
      <p className="joy-gift-terms">{labels.giftTerms}</p>
      <div className="joy-gift-grid">
        {JOY_GIFT_TIERS.map((tier) => {
          const missing = Math.max(0, tier.coinCost - wallet.coins);
          return <article className="joy-gift-card" key={tier.id}>
            <img src={resolveAssetUrl(giftImages[tier.id])} alt={rewardName(tier, language)} loading="lazy" onError={handleImageFallback} />
            <div><span className="joy-gift-tag"><Gift size={14} /> {language === 'zh' ? '免费礼物' : 'Free gift'}</span>
              <h3>{rewardName(tier, language)}</h3><strong><Coins size={17} /> 500 {labels.coins}</strong>
              <p>{giftFulfillmentCopy(language)}</p>
              <button type="button" disabled={loading || Boolean(busyTier) || missing > 0 || Boolean(serviceError)} onClick={() => handleRedeem(tier.id)}>
                {busyTier === tier.id ? labels.redeeming : missing ? labels.need.replace('{count}', missing) : labels.redeem}
              </button>
            </div>
          </article>;
        })}
      </div>
      {standalone && <CozyGardenFeature compact />}
      <h3 className="joy-section-title">{labels.cash}</h3>
      <div className="joy-tier-grid">
        {JOY_VOUCHER_TIERS.map((tier) => {
          const missingCoins = Math.max(0, tier.coinCost - wallet.coins);
          const disabled = loading || busyTier || missingCoins > 0;
          return (
            <article className="joy-tier-card" key={tier.id}>
              <Gift size={24} />
              <strong>RM{formatRm(tier.valueSen)}</strong>
              <span>{tier.coinCost} {labels.coins}</span>
              <small>{labels.min.replace('{amount}', formatRm(tier.minSubtotalSen))}</small>
              <button type="button" disabled={disabled} onClick={() => handleRedeem(tier.id)}>
                {busyTier === tier.id
                  ? labels.redeeming
                  : missingCoins
                    ? labels.need.replace('{count}', missingCoins)
                    : labels.redeem}
              </button>
            </article>
          );
        })}
      </div>
      </div>}

      {tab === 'wallet' && <div className="joy-wallet-section" role="tabpanel" id="joy-panel-wallet" aria-labelledby="joy-tab-wallet">
        <h3>{labels.wallet}</h3>
        <CozyGardenFeature compact />
        <div className="joy-status-filters" aria-label={labels.wallet}>
          {[['all', language === 'zh' ? '全部' : 'All'], ['available', labels.available], ['reserved', labels.reserved], ['used', labels.used]].map(([id, label]) => (
            <button type="button" key={id} aria-pressed={statusFilter === id} onClick={() => setStatusFilter(id)}>{label} ({id === 'all' ? wallet.vouchers.length : wallet.vouchers.filter((reward) => reward.status === id).length})</button>
          ))}
        </div>
        {visibleRewards.length === 0 ? (
          <p className="joy-wallet-empty">{labels.empty}</p>
        ) : (
          <div className="joy-voucher-list">
            {visibleRewards.map((voucher) => (
              <article className={`joy-voucher-ticket status-${voucher.status}`} key={voucher.code}>
                <div>
                  <strong>{rewardName(voucher, language)}</strong>
                  <span>{isGiftReward(voucher) ? labels.giftTerms : labels.min.replace('{amount}', formatRm(voucher.minSubtotalSen))}</span>
                  <code>{voucher.code}</code>
                  <small>{new Date(voucher.createdAt).toLocaleString(language === 'zh' ? 'zh-MY' : 'en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}{voucher.reservedOrderId ? ` · ${voucher.reservedOrderId}` : ''}</small>
                </div>
                <div className="joy-voucher-actions">
                  <span className="joy-voucher-status">
                    {voucher.status === 'available'
                      ? labels.available
                      : voucher.status === 'reserved'
                        ? labels.reserved
                        : labels.used}
                  </span>
                  {voucher.status === 'available' && <button type="button" onClick={() => handleCopy(voucher.code)}>
                    {copiedCode === voucher.code ? <Check size={16} /> : <Copy size={16} />}
                    {copiedCode === voucher.code ? labels.copied : labels.copy}
                  </button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>}

      {tab === 'history' && <div className="joy-wallet-section" role="tabpanel" id="joy-panel-history" aria-labelledby="joy-tab-history">
        <h3>{labels.history}</h3><p className="joy-history-note">{labels.historyNote}</p>
        {historyError ? <p className="joy-rewards-notice" role="status">{historyError}</p> : historyLoading ? <p role="status">{language === 'zh' ? '正在加载记录…' : 'Loading history…'}</p> : !wallet.history.length ? <p className="joy-wallet-empty">{labels.historyEmpty}</p> : <ol className="joy-history-list">
          {wallet.history.map((entry) => <li key={`${entry.type}-${entry.id}`}>
            <span className={`joy-history-icon ${entry.type}`}><Coins size={20} /></span>
            <div><strong>{entry.type === 'redeemed' ? `${labels.redeemed} · ${rewardName(JOY_VOUCHER_TIERS.find((tier) => tier.id === entry.tierId) || { tierId: entry.tierId }, language)}` : labels.earned}</strong>
              <small>{new Date(entry.createdAt).toLocaleString(language === 'zh' ? 'zh-MY' : 'en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</small>
              {entry.code && <code>{entry.code}</code>}
            </div><b className={entry.amount > 0 ? 'joy-history-positive' : ''}>{entry.amount > 0 ? '+' : ''}{entry.amount}</b>
          </li>)}
        </ol>}
      </div>}
      {!standalone && <Link className="joy-wallet-link" to="/joy-coins">{labels.viewWallet} →</Link>}

      <div className="joy-account-section">
        <div className="joy-account-copy">
          <ShieldCheck size={26} />
          <div>
            <h3>{labels.accountTitle}</h3>
            <p>{labels.accountIntro}</p>
          </div>
        </div>

        {isCustomer ? (
          <div className="joy-account-signed-in">
            <span>{labels.signedIn} <strong>{user.email}</strong></span>
            <button type="button" onClick={signOutCustomer}>
              <LogOut size={16} /> {labels.signOut}
            </button>
          </div>
        ) : (
          <>
            <div className="joy-account-tabs">
              <button
                type="button"
                className={accountMode === 'create' ? 'active' : ''}
                onClick={() => setAccountMode('create')}
              >
                <UserPlus size={16} /> {labels.create}
              </button>
              <button
                type="button"
                className={accountMode === 'signin' ? 'active' : ''}
                onClick={() => setAccountMode('signin')}
              >
                <LogIn size={16} /> {labels.signIn}
              </button>
            </div>
            <form className="joy-account-form" onSubmit={handleAccountSubmit}>
              <input
                type="email"
                required
                value={accountForm.email}
                onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                placeholder={labels.email}
                autoComplete="email"
              />
              <input
                type="password"
                required
                minLength={6}
                value={accountForm.password}
                onChange={(event) => setAccountForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={labels.password}
                autoComplete={accountMode === 'create' ? 'new-password' : 'current-password'}
              />
              <button type="submit" disabled={accountBusy}>
                {accountBusy
                  ? accountMode === 'create' ? labels.creating : labels.signingIn
                  : accountMode === 'create' ? labels.create : labels.signIn}
              </button>
            </form>
            <p className="joy-account-note">{labels.guestNote}</p>
          </>
        )}
      </div>

      {(notice || serviceError) && (
        <p className="joy-rewards-notice" role="status">{notice || serviceError}</p>
      )}

      {redeemedNotice && createPortal(
        <div
          className="joy-redeem-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRedeemedVoucher();
          }}
        >
          <section
            className="joy-redeem-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="joy-redeem-dialog-title"
            aria-label={labels.redeemedAria}
          >
            <button
              ref={redeemDialogCloseRef}
              type="button"
              className="joy-redeem-dialog-close"
              aria-label={labels.closeDialog}
              onClick={closeRedeemedVoucher}
            >
              <X size={20} />
            </button>

            <div className="joy-redeem-dialog-icon" aria-hidden="true">
              <Sparkles size={24} />
            </div>
            <span className="joy-redeem-dialog-eyebrow">{labels.redeemedEyebrow}</span>
            <h2 id="joy-redeem-dialog-title">{labels.redeemedTitle}</h2>
            <p>{labels.redeemedIntro}</p>

            <div className="joy-redeem-dialog-ticket">
              <Gift size={22} aria-hidden="true" />
              <strong>{rewardName(redeemedVoucher, language)}</strong>
              <span>{isGiftReward(redeemedVoucher) ? labels.giftUse : labels.minimumSpend.replace('{amount}', redeemedNotice.minimumLabel)}</span>
              <small>{labels.voucherCode}</small>
              <code>{redeemedNotice.code}</code>
              <button type="button" onClick={() => handleCopy(redeemedNotice.code)}>
                {copiedCode === redeemedNotice.code ? <Check size={17} /> : <Copy size={17} />}
                {copiedCode === redeemedNotice.code ? labels.copied : labels.copy}
              </button>
            </div>

            <button type="button" className="joy-redeem-dialog-done" onClick={closeRedeemedVoucher}>
              {labels.close}
            </button>
          </section>
        </div>,
        document.body
      )}
    </section>
  );
};

export default JoyRewardsPanel;
