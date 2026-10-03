import React from 'react';
import { Check, Gift, PackageCheck, X } from 'lucide-react';
import { products, productById, wraps } from '../data/giftRushConfig.js';
import { ProductImage } from './GiftArt.jsx';

const PackingCounter = ({ state, copy, dispatch }) => {
  const order = state.orders.find(item => item.id === state.selectedOrderId);
  const selectedWrap = order?.tray.wrapId;
  const act = (type, payload = {}) => dispatch({ type, sessionId: state.sessionId, orderId: order?.id, ...payload });
  const quantities = order?.items.reduce((all, id) => ({ ...all, [id]: (all[id] || 0) + 1 }), {}) || {};
  return <div className="gift-workspace">
    <section className="gift-packing-desk" aria-label={copy.tray}>
      <div className="gift-request">
        <span className="gift-section-label">{copy.request}</span>
        {order ? <>
          <p className="gift-request-for">{copy.giftFor} <strong>{copy.customers[order.customerId]}</strong> ♡</p>
          <ul className="gift-request-items">
            {Object.entries(quantities).map(([id, quantity]) => <li key={id} data-request-item={id} data-quantity={quantity}>
              <ProductImage product={productById.get(id)} label={copy.products[id]} />
              <span>{copy.products[id]}</span><b>×{quantity}</b>
            </li>)}
          </ul>
          <p className={'gift-request-wrap ' + order.wrapId} data-request-wrap={order.wrapId}>
            <span aria-hidden="true">{wraps.find(wrap => wrap.id === order.wrapId).symbol}</span> {copy.wrapNeeded}: <strong>{copy.wraps[order.wrapId]}</strong>
          </p>
        </> : <div className="gift-empty-request"><Gift size={30} /><strong>{copy.waiting}</strong><p>{copy.waitingNote}</p></div>}
      </div>
      <div className="gift-tray-heading"><span className="gift-section-label">{copy.tray}</span>
        <button type="button" className="gift-clear" onClick={() => act('CLEAR_TRAY')} disabled={!order}>{copy.clear}</button>
      </div>
      <div className={'gift-tray ' + (order?.tray.wrapId || '')}>
        {Array.from({ length: 3 }, (_, index) => {
          const id = order?.tray.items[index];
          return id ? <button type="button" className="gift-tray-slot filled" key={index}
            aria-label={copy.remove + ' ' + copy.products[id]} onClick={() => act('REMOVE_ITEM', { slotIndex: index })}>
            <ProductImage product={productById.get(id)} label={copy.products[id]} /><X size={14} />
          </button> : <div key={index} className="gift-tray-slot" aria-label={copy.emptySlot}><span>+</span></div>;
        })}
      </div>
      <div className="gift-wrapping"><span className="gift-section-label gift-wrapping-status" role="status">
        {order ? selectedWrap ? copy.selectedWrapping + copy.wraps[selectedWrap] : copy.chooseWrapping : copy.wrapping}
      </span>
        <div className="gift-wrap-options">{wraps.map(wrap => <button type="button" key={wrap.id}
          className={'gift-wrap ' + wrap.id} aria-label={copy.wraps[wrap.id]}
          aria-pressed={order?.tray.wrapId === wrap.id} disabled={!order}
          onClick={() => act('SELECT_WRAP', { wrapId: wrap.id })}><span aria-hidden="true">{wrap.symbol}</span><span>{copy.wraps[wrap.id]}</span>
          {selectedWrap === wrap.id ? <Check className="gift-wrap-check" size={17} aria-hidden="true" /> : null}
        </button>)}</div>
      </div>
      <button type="button" className="gift-primary gift-pack" disabled={!order || !selectedWrap} onClick={() => act('PACK')}><PackageCheck size={21} />{order && !selectedWrap ? copy.chooseWrappingFirst : copy.pack}</button>
    </section>
    <section className="gift-product-shelf" aria-label={copy.shelf}>
      <div className="gift-shelf-sign"><span>ASHLIFE</span><h2>{copy.shelf}</h2></div>
      <div className="gift-shelf-grid">{products.map(product => <button type="button" className="gift-product" key={product.id}
        aria-label={copy.products[product.id]} disabled={!order || order.tray.items.length >= 3}
        onClick={() => act('ADD_ITEM', { productId: product.id })}>
        <ProductImage product={product} label={copy.products[product.id]} /><span>{copy.products[product.id]}</span>
      </button>)}</div>
      <p className="gift-shelf-note">♡ {copy.stickerHint}</p>
    </section>
  </div>;
};
export default PackingCounter;
