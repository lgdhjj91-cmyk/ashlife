import React from 'react';
import { GiftSprite } from './GiftArt.jsx';
import { wraps } from '../data/giftRushConfig.js';
const CustomerQueue = ({ state, copy, dispatch }) => (
  <div className="gift-customer-queue" aria-label={copy.selectCustomer}>
    {Array.from({ length: 3 }, (_, index) => {
      const order = state.orders[index];
      if (!order) return <div className="gift-customer-space" key={'space-' + index} aria-hidden="true"><span>♡</span></div>;
      const selected = state.selectedOrderId === order.id;
      return <button type="button" key={order.id} className={'gift-customer gift-wrap-pattern ' + order.wrapId + (selected ? ' selected' : '')}
        data-customer-wrap={order.wrapId}
        aria-pressed={selected} aria-label={copy.customers[order.customerId] + ' · ' + copy.wrapNeeded + ': ' + copy.wraps[order.wrapId] + ' · ' + Math.ceil(order.remainingPatienceMs / 1000) + ' ' + copy.patience}
        onClick={() => dispatch({ type: 'SELECT_ORDER', sessionId: state.sessionId, orderId: order.id })}>
        <span className="gift-customer-status">{selected ? copy.servingBadge : copy.waitingBadge}</span>
        <GiftSprite customerId={order.customerId} label={copy.customers[order.customerId]} />
        <span className="gift-customer-wrap"><span aria-hidden="true">{wraps.find(wrap => wrap.id === order.wrapId).symbol}</span>{copy.wraps[order.wrapId]}</span>
        <span className="gift-customer-name">{copy.customers[order.customerId]} <small>{Math.ceil(order.remainingPatienceMs / 1000)}s</small></span>
        <span className="gift-patience" aria-hidden="true"><span style={{ width: order.remainingPatienceMs / order.initialPatienceMs * 100 + '%' }} /></span>
      </button>;
    })}
  </div>
);
export default CustomerQueue;
