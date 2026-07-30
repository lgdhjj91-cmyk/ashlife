import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Coins, Ticket, X } from 'lucide-react';
import { useJoyWallet } from '../context/JoyWalletContext';
import { useLanguage } from '../context/LanguageContext';
import { getVoucherEligibility } from '../joy/joyVoucherRules';
import { resolveVoucherSelection } from '../joy/joyWalletState';
import './JoyVoucherCard.css';

const copy = {
  en: {
    title: 'Joy voucher',
    auto: 'Best eligible voucher is applied automatically.',
    applied: 'Applied automatically',
    keep: 'Keep for next purchase',
    kept: 'Vouchers are being kept for your next purchase.',
    useBest: 'Apply best voucher',
    choose: 'Choose another voucher',
    enter: 'Enter voucher code',
    placeholder: 'JOY-RM1-XXXXXXXXXX',
    apply: 'Apply code',
    applying: 'Checking…',
    invalid: 'This voucher code is invalid.',
    reserved: 'This voucher is reserved for another order.',
    used: 'This voucher has already been used.',
    minimum: 'This cart does not meet the voucher minimum spend.',
    none: 'No saved voucher currently meets this cart’s minimum spend.',
    min: 'Min. items RM{amount}',
    discount: 'RM{amount} off',
    onlineNote: 'Voucher reservation and one-time use are secured during Pay Online checkout.',
  },
  zh: {
    title: 'Joy 优惠券',
    auto: '系统会自动套用最优惠且符合条件的优惠券。',
    applied: '已自动套用',
    keep: '留到下次使用',
    kept: '优惠券会保留到下次购买。',
    useBest: '套用最佳优惠券',
    choose: '选择其他优惠券',
    enter: '输入优惠券代码',
    placeholder: 'JOY-RM1-XXXXXXXXXX',
    apply: '套用代码',
    applying: '检查中…',
    invalid: '此优惠券代码无效。',
    reserved: '此优惠券已保留给其他订单。',
    used: '此优惠券已经使用。',
    minimum: '购物车未达到优惠券的最低消费。',
    none: '目前没有符合购物车最低消费的优惠券。',
    min: '商品最低 RM{amount}',
    discount: '优惠 RM{amount}',
    onlineNote: '使用在线付款结账时，系统会安全保留优惠券并确保只能使用一次。',
  },
};

const formatRm = (sen) => (Number(sen || 0) / 100).toFixed(2);

const JoyVoucherCard = ({ subtotalSen }) => {
  const { language } = useLanguage();
  const labels = copy[language] || copy.en;
  const {
    wallet,
    selectedVoucher,
    autoApplySuppressed,
    previewVoucher,
    chooseVoucher,
    keepVoucherForLater,
    enableAutoApply,
  } = useJoyWallet();
  const [manualCode, setManualCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const availableVouchers = useMemo(
    () => wallet.vouchers.filter((voucher) => voucher.status === 'available'),
    [wallet.vouchers]
  );

  useEffect(() => {
    const next = resolveVoucherSelection({
      vouchers: availableVouchers,
      subtotalSen,
      current: selectedVoucher,
      suppressed: autoApplySuppressed,
    });
    if ((next?.code || '') !== (selectedVoucher?.code || '')) {
      chooseVoucher(next);
    }
  }, [
    autoApplySuppressed,
    availableVouchers,
    chooseVoucher,
    selectedVoucher,
    subtotalSen,
  ]);

  const handleManualApply = async (event) => {
    event.preventDefault();
    setChecking(true);
    setMessage('');
    const result = await previewVoucher(manualCode, subtotalSen);
    setChecking(false);
    if (result.success && result.valid && result.voucher) {
      chooseVoucher(result.voucher);
      setManualCode(result.voucher.code);
      setMessage(labels.applied);
      return;
    }

    const reason = result.reason || 'invalid';
    setMessage(labels[reason] || result.error || labels.invalid);
  };

  const eligibleSaved = availableVouchers.filter(
    (voucher) => getVoucherEligibility(voucher, subtotalSen).eligible
  );

  return (
    <section className="joy-checkout-card">
      <div className="joy-checkout-heading">
        <span><Ticket size={20} /> {labels.title}</span>
        <small>{labels.auto}</small>
      </div>

      {selectedVoucher ? (
        <div className="joy-applied-voucher">
          <CheckCircle size={22} />
          <div>
            <strong>{labels.discount.replace('{amount}', formatRm(selectedVoucher.valueSen))}</strong>
            <code>{selectedVoucher.code}</code>
            <span>{labels.min.replace('{amount}', formatRm(selectedVoucher.minSubtotalSen))}</span>
          </div>
          <button type="button" onClick={keepVoucherForLater}>
            <X size={16} /> {labels.keep}
          </button>
        </div>
      ) : autoApplySuppressed ? (
        <div className="joy-kept-message">
          <span>{labels.kept}</span>
          <button type="button" onClick={enableAutoApply}>{labels.useBest}</button>
        </div>
      ) : (
        <p className="joy-no-voucher">{labels.none}</p>
      )}

      {eligibleSaved.length > 1 && (
        <label className="joy-voucher-select">
          <span>{labels.choose}</span>
          <select
            value={selectedVoucher?.code || ''}
            onChange={(event) =>
              chooseVoucher(eligibleSaved.find((voucher) => voucher.code === event.target.value) || null)
            }
          >
            {eligibleSaved.map((voucher) => (
              <option value={voucher.code} key={voucher.code}>
                RM{formatRm(voucher.valueSen)} — {voucher.code}
              </option>
            ))}
          </select>
        </label>
      )}

      <form className="joy-code-form" onSubmit={handleManualApply}>
        <label htmlFor="joy-voucher-code">{labels.enter}</label>
        <div>
          <input
            id="joy-voucher-code"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder={labels.placeholder}
            autoComplete="off"
          />
          <button type="submit" disabled={checking || !manualCode.trim()}>
            <Coins size={16} /> {checking ? labels.applying : labels.apply}
          </button>
        </div>
      </form>

      {message && <p className="joy-code-message" role="status">{message}</p>}
      <p className="joy-online-note">{labels.onlineNote}</p>
    </section>
  );
};

export default JoyVoucherCard;
