import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { createFirestoreJoyStore, createJoyRepository } from '../src/joy/joyFirestoreRepository.js';

let env;
const code = 'CG-PLUSHIE-AAAAAAAAAA';
const voucher = (overrides = {}) => ({ code, tierId: 'plushie', coinCost: 5000, source: 'garden', currency: 'garden', requestId: 'r1', valueSen: 0, minSubtotalSen: 0, ownerUid: 'garden', status: 'available', createdAt: Timestamp.now(), updatedAt: Timestamp.now(), ...overrides });
const db = (uid, claims = {}) => env.authenticatedContext(uid, claims).firestore();
const repo = uid => createJoyRepository(createFirestoreJoyStore(db(uid)));
async function seed(entries) {
  await env.withSecurityRulesDisabled(async context => {
    const batch = writeBatch(context.firestore());
    for (const [path, value] of Object.entries(entries)) batch.set(doc(context.firestore(), path), value);
    await batch.commit();
  });
}
function issue(database, overrides = {}) {
  const record = voucher({ createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...overrides });
  const batch = writeBatch(database);
  batch.set(doc(database, `joyVouchers/${record.code}`), record);
  batch.set(doc(database, `gardenRewardGuests/garden/requests/${record.requestId}`), { code: record.code, tierId: record.tierId, coinCost: record.coinCost, debitRequired: true, createdAt: serverTimestamp() });
  batch.set(doc(database, `gardenRewardGuests/garden/openGifts/${record.tierId}`), { code: record.code, updatedAt: serverTimestamp() });
  return batch.commit();
}
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-ashlife-gifts', firestore: { host: '127.0.0.1', port: 8088, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await seed({ 'giftCatalog/plushie': { enabled: true, coinCost: 5000 }, 'giftStock/plushie': { available: 1 }, 'rewardAdmins/admin': { enabled: true } });
});
after(async () => { await env?.cleanup(); });

test('guest issuance requires the matching catalogue, receipt and outstanding pointer', async () => {
  await assertSucceeds(issue(db('garden')));
  assert.equal((await getDoc(doc(db('garden'), `joyVouchers/${code}`))).data().source, 'garden');
  await assertFails(issue(db('garden'), { code: 'CG-PLUSHIE-BBBBBBBBBB', requestId: 'r2' }));
});
test('disabled catalogue, wrong price, wrong owner and unsupported tiers cannot mint Garden vouchers', async () => {
  await assertFails(issue(db('other')));
  await assertFails(issue(db('garden'), { coinCost: 1 }));
  await assertFails(issue(db('garden'), { tierId: 'rm5', code: 'CG-RM5-AAAAAAAAAA', valueSen: 500 }));
  await seed({ 'giftCatalog/plushie': { enabled: false, coinCost: 5000 } });
  await assertFails(issue(db('garden')));
});
test('another guest can use a known code, stock is reserved once, and release is idempotent', async () => {
  await seed({ [`joyVouchers/${code}`]: voucher() });
  const buyer = repo('buyer');
  await assertSucceeds(buyer.reserveJoyRewards('buyer', { codes: [code], orderId: 'o1', subtotalSen: 100 }));
  await assertSucceeds(buyer.reserveJoyRewards('buyer', { codes: [code], orderId: 'o1', subtotalSen: 100 }));
  assert.equal((await getDoc(doc(db('buyer'), 'giftStock/plushie'))).data().available, 0);
  await assertSucceeds(buyer.releaseJoyRewards('buyer', { codes: [code], orderId: 'o1' }));
  await assertSucceeds(buyer.releaseJoyRewards('buyer', { codes: [code], orderId: 'o1' }));
  assert.equal((await getDoc(doc(db('buyer'), 'giftStock/plushie'))).data().available, 1);
});
test('stock updates without the voucher transition and voucher reservation without stock are denied', async () => {
  await seed({ [`joyVouchers/${code}`]: voucher() });
  await assertFails(setDoc(doc(db('buyer'), 'giftStock/plushie'), { available: 0, lastVoucherCode: code, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db('buyer'), `joyVouchers/${code}`), voucher({ status: 'reserved', stockReserved: true, reservedByUid: 'buyer', reservedOrderId: 'o', reservedSubtotalSen: 100, reservedAt: serverTimestamp(), updatedAt: serverTimestamp() })));
});
test('stock administration requires an explicitly trusted administrator', async () => {
  await assertFails(setDoc(doc(db('buyer'), 'giftStock/plushie'), { available: 99 }));
  await assertFails(setDoc(doc(db('customer', { firebase: { sign_in_provider: 'password' } }), 'giftStock/plushie'), { available: 99 }));
  await assertSucceeds(setDoc(doc(db('admin'), 'giftStock/plushie'), { available: 2 }));
});
test('confirmation consumes a gift; subsequent cancellation does not restore its stock', async () => {
  await seed({ [`joyVouchers/${code}`]: voucher() });
  await repo('buyer').reserveJoyRewards('buyer', { codes: [code], orderId: 'o', subtotalSen: 100 });
  await assertFails(repo('stranger').settleJoyRewards({ codes: [code], orderId: 'o', orderStatus: 'confirmed' }));
  await assertSucceeds(repo('admin').settleJoyRewards({ codes: [code], orderId: 'o', orderStatus: 'confirmed' }));
  await assertSucceeds(repo('admin').settleJoyRewards({ codes: [code], orderId: 'o', orderStatus: 'cancelled' }));
  assert.equal((await getDoc(doc(db('buyer'), 'giftStock/plushie'))).data().available, 0);
});
test('two concurrent shoppers cannot reserve the last physical gift twice', async () => {
  const secondCode = 'CG-PLUSHIE-BBBBBBBBBB';
  await seed({ [`joyVouchers/${code}`]: voucher(), [`joyVouchers/${secondCode}`]: voucher({ code: secondCode, ownerUid: 'another-garden' }) });
  const results = await Promise.allSettled([repo('one').reserveJoyRewards('one', { codes: [code], orderId: 'o1', subtotalSen: 100 }), repo('two').reserveJoyRewards('two', { codes: [secondCode], orderId: 'o2', subtotalSen: 100 })]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
});
test('guest history is private and legacy Joy cash checkout still works', async () => {
  await seed({ [`joyVouchers/${code}`]: voucher(), 'joyVouchers/JOY-RM1-AAAAAAAAAA': voucher({ code: 'JOY-RM1-AAAAAAAAAA', tierId: 'rm1', valueSen: 100, minSubtotalSen: 1000, coinCost: 100, source: 'joy' }) });
  await assertFails(getDocs(collection(db('stranger'), 'joyVouchers')));
  await assertSucceeds(repo('buyer').reserveJoyVoucher('buyer', { code: 'JOY-RM1-AAAAAAAAAA', orderId: 'cash-order', subtotalSen: 1000 }));
});

test('all three gift categories and a cash voucher reserve and cancel in one transaction', async () => {
  const nano = 'CG-NANOTOY-AAAAAAAAAA';
  const key = 'CG-KEYCHAIN-AAAAAAAAAA';
  const cash = 'JOY-RM1-AAAAAAAAAA';
  await seed({
    [`joyVouchers/${code}`]: voucher(),
    [`joyVouchers/${nano}`]: voucher({ code: nano, tierId: 'nanotoy' }),
    [`joyVouchers/${key}`]: voucher({ code: key, tierId: 'keychain' }),
    [`joyVouchers/${cash}`]: { code: cash, tierId: 'rm1', coinCost: 100, ownerUid: 'cash-owner', status: 'available', valueSen: 100, minSubtotalSen: 1000, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    'giftStock/nanotoy': { available: 2 }, 'giftStock/keychain': { available: 2 },
  });
  const codes = [code, nano, key, cash];
  await assertSucceeds(repo('buyer').reserveJoyRewards('buyer', { codes, orderId: 'bundle', subtotalSen: 1000 }));
  await assertSucceeds(repo('admin').settleJoyRewards({ codes, orderId: 'bundle', orderStatus: 'rejected' }));
  assert.equal((await getDoc(doc(db('buyer'), 'giftStock/plushie'))).data().available, 1);
});

test('guest can reuse an outstanding voucher receipt without charging and issue again after consumption', async () => {
  await issue(db('garden'));
  await assertSucceeds(setDoc(doc(db('garden'), 'gardenRewardGuests/garden/requests/reuse'), { code, tierId: 'plushie', coinCost: 5000, debitRequired: false, createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db('other'), 'gardenRewardGuests/garden/requests/stolen'), { code, tierId: 'plushie', coinCost: 5000, debitRequired: false, createdAt: serverTimestamp() }));
  await repo('buyer').reserveJoyRewards('buyer', { codes: [code], orderId: 'o', subtotalSen: 100 });
  await repo('admin').settleJoyRewards({ codes: [code], orderId: 'o', orderStatus: 'confirmed' });
  await seed({ 'giftStock/plushie': { available: 1 } });
  await assertSucceeds(issue(db('garden'), { code: 'CG-PLUSHIE-BBBBBBBBBB', requestId: 'r2' }));
});
