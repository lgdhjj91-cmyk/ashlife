import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { get, ref } from 'firebase/database';
import { firestore, database } from '../firebase';
import { useJoyWallet } from '../context/JoyWalletContext';
import { recoverAbandonedGiftReservation } from '../joy/abandonedGiftReservation';

export default function AbandonedGiftRecovery() {
  const { settleRewards } = useJoyWallet();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const recover = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await recoverAbandonedGiftReservation(code, {
        readVoucher: async (value) => (await getDoc(doc(firestore, 'joyVouchers', value))).data(),
        orderExists: async (orderId) => (await get(ref(database, `orders/${orderId}`))).exists(),
        settle: async (reservation) => {
          const result = await settleRewards(reservation);
          if (!result.success) throw new Error(result.error);
        },
      });
      setMessage('Gift code reopened and its reserved stock returned.');
      setCode('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  return <details className="admin-panel">
    <summary>Recover an abandoned gift checkout</summary>
    <p>For a customer who closed checkout without submitting an order. Check with the customer that no payment is awaiting submission first. Only reservations older than 24 hours with no order can be recovered.</p>
    <form onSubmit={recover}>
      <label htmlFor="abandoned-gift-code">Reserved gift code</label>
      <input id="abandoned-gift-code" value={code} onChange={(event) => setCode(event.target.value)} required disabled={busy} />
      <button type="submit" className="btn btn-secondary" disabled={busy || !code.trim()}>{busy ? 'Checking…' : 'Check and return gift stock'}</button>
    </form>
    {message && <p role="status">{message}</p>}
  </details>;
}
