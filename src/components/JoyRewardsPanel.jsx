import React, { useState } from 'react';
import { Check, Coins, Copy, Gift, LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react';
import { useJoyWallet } from '../context/JoyWalletContext';
import { useLanguage } from '../context/LanguageContext';
import { JOY_VOUCHER_TIERS } from '../joy/joyVoucherRules';
import './JoyRewardsPanel.css';

const copy = {
  en: {
    eyebrow: 'Joy Rewards',
    title: 'Turn playtime into savings',
    intro: 'Redeem Joy Coins for a voucher. Copy the code for any browser, or let checkout apply it automatically.',
    coins: 'Joy Coins',
    redeem: 'Redeem',
    redeeming: 'Creating voucher…',
    need: 'Need {count} more coins',
    min: 'Minimum items RM{amount}',
    wallet: 'My vouchers',
    empty: 'No vouchers yet. Play a game, collect coins, then redeem one here.',
    copy: 'Copy code',
    copied: 'Copied',
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
    title: '把游戏奖励变成购物优惠',
    intro: '使用 Joy Coins 兑换优惠券。复制代码即可在其他设备使用，结账时也会自动套用。',
    coins: 'Joy Coins',
    redeem: '兑换',
    redeeming: '正在建立优惠券…',
    need: '还需要 {count} 枚金币',
    min: '商品最低消费 RM{amount}',
    wallet: '我的优惠券',
    empty: '目前还没有优惠券。先玩游戏赚取金币，再回来兑换。',
    copy: '复制代码',
    copied: '已复制',
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

const JoyRewardsPanel = () => {
  const { language } = useLanguage();
  const labels = copy[language] || copy.en;
  const {
    user,
    isCustomer,
    wallet,
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

  const handleRedeem = async (tierId) => {
    setBusyTier(tierId);
    setNotice('');
    const result = await redeemVoucher(tierId);
    setBusyTier('');
    setNotice(result.success ? `${result.voucher.code} ${labels.available}` : result.error);
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

  return (
    <section className="joy-rewards-panel" id="joy-rewards">
      <div className="joy-rewards-heading">
        <div>
          <span className="playroom-pill">{labels.eyebrow}</span>
          <h2>{labels.title}</h2>
          <p>{labels.intro}</p>
        </div>
        <div className="joy-wallet-balance">
          <Coins size={24} />
          <strong>{loading ? '…' : wallet.coins}</strong>
          <span>{labels.coins}</span>
        </div>
      </div>

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

      <div className="joy-wallet-section">
        <h3>{labels.wallet}</h3>
        {wallet.vouchers.length === 0 ? (
          <p className="joy-wallet-empty">{labels.empty}</p>
        ) : (
          <div className="joy-voucher-list">
            {wallet.vouchers.map((voucher) => (
              <article className={`joy-voucher-ticket status-${voucher.status}`} key={voucher.code}>
                <div>
                  <strong>RM{formatRm(voucher.valueSen)}</strong>
                  <span>{labels.min.replace('{amount}', formatRm(voucher.minSubtotalSen))}</span>
                  <code>{voucher.code}</code>
                </div>
                <div className="joy-voucher-actions">
                  <span className="joy-voucher-status">
                    {voucher.status === 'available'
                      ? labels.available
                      : voucher.status === 'reserved'
                        ? labels.reserved
                        : labels.used}
                  </span>
                  <button type="button" onClick={() => handleCopy(voucher.code)}>
                    {copiedCode === voucher.code ? <Check size={16} /> : <Copy size={16} />}
                    {copiedCode === voucher.code ? labels.copied : labels.copy}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

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
    </section>
  );
};

export default JoyRewardsPanel;
