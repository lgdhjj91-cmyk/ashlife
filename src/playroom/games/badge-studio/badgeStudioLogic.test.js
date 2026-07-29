import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyImageQuality,
  createOrderId,
  expandDesignQuantities,
  getCoverTransform,
  mmToPx,
  moveSlot,
  normalizeMalaysianPhone,
  paginateSlots,
  sanitizeFileName,
  validateImageFile,
  validateOrderDetails,
} from './badgeStudioLogic.js';

test('millimetres convert to the standard rounded A4 dimensions at 300 DPI', () => {
  assert.equal(mmToPx(210, 300), 2480);
  assert.equal(mmToPx(297, 300), 3508);
  assert.equal(mmToPx(70, 300), 827);
});

test('cover transform keeps aspect ratio and centers a landscape image', () => {
  assert.deepEqual(
    getCoverTransform({ imageWidth: 1200, imageHeight: 800, frameSize: 600 }),
    { x: -150, y: 0, scale: 0.75, rotation: 0 }
  );
});

test('image quality reflects usable crop pixels at print size', () => {
  assert.equal(
    classifyImageQuality({ width: 1200, height: 1000, artworkDiameterMm: 70, dpi: 300, scale: 1 }),
    'good'
  );
  assert.equal(
    classifyImageQuality({ width: 700, height: 600, artworkDiameterMm: 70, dpi: 300, scale: 1 }),
    'acceptable'
  );
  assert.equal(
    classifyImageQuality({ width: 500, height: 400, artworkDiameterMm: 70, dpi: 300, scale: 1 }),
    'low'
  );
});

test('design quantities expand in collection order and retain stable instance IDs', () => {
  const expanded = expandDesignQuantities([
    { id: 'a', quantity: 3 },
    { id: 'b', quantity: 2 },
  ]);

  assert.deepEqual(
    expanded.map((entry) => [entry.designId, entry.instanceId]),
    [
      ['a', 'a-1'],
      ['a', 'a-2'],
      ['a', 'a-3'],
      ['b', 'b-1'],
      ['b', 'b-2'],
    ]
  );
});

test('expanded badges paginate into conservative eight-slot A4 sheets', () => {
  const entries = Array.from({ length: 18 }, (_, index) => ({ instanceId: `badge-${index + 1}` }));
  const pages = paginateSlots(entries, 8);

  assert.equal(pages.length, 3);
  assert.deepEqual(pages.map((page) => page.length), [8, 8, 2]);
});

test('slot movement swaps adjacent items without mutating the source', () => {
  const source = [{ instanceId: 'a' }, { instanceId: 'b' }, { instanceId: 'c' }];
  const moved = moveSlot(source, 1, -1);

  assert.deepEqual(moved.map((entry) => entry.instanceId), ['b', 'a', 'c']);
  assert.deepEqual(source.map((entry) => entry.instanceId), ['a', 'b', 'c']);
  assert.equal(moveSlot(source, 0, -1), source);
});

test('order IDs combine prefix, local date, and six uppercase alphanumeric characters', () => {
  const orderId = createOrderId({
    now: new Date('2026-07-28T12:00:00+08:00'),
    randomValues: [0, 0.03, 0.26, 0.29, 0.62, 0.999],
  });

  assert.equal(orderId, 'ASH-20260728-ABJKW9');
  assert.match(orderId, /^ASH-\d{8}-[A-Z0-9]{6}$/);
});

test('filenames are stripped of path syntax and unsafe punctuation', () => {
  assert.equal(sanitizeFileName('..\\family <photo> #1.PNG'), 'family-photo-1.PNG');
  assert.equal(sanitizeFileName(''), 'file');
});

test('image validation accepts supported photos and reports one clear rejection', () => {
  assert.deepEqual(
    validateImageFile({ name: 'badge.webp', type: 'image/webp', size: 2_000_000 }),
    { valid: true, error: '' }
  );
  assert.equal(
    validateImageFile({ name: 'badge.gif', type: 'image/gif', size: 2_000_000 }).error,
    'Use a JPG, PNG, or WebP image.'
  );
  assert.equal(
    validateImageFile({ name: 'badge.png', type: 'image/png', size: 16_000_000 }).error,
    'This image is larger than 15 MB.'
  );
});

test('Malaysian-friendly WhatsApp normalization accepts local and country formats', () => {
  assert.equal(normalizeMalaysianPhone('012-345 6789'), '60123456789');
  assert.equal(normalizeMalaysianPhone('+60 11 3304 6104'), '601133046104');
  assert.equal(normalizeMalaysianPhone('6012333'), '');
});

test('order details require identity, design review, and low-quality acknowledgement when needed', () => {
  assert.deepEqual(
    validateOrderDetails(
      { name: '', whatsapp: '', designChecked: false, lowResolutionAccepted: false },
      { hasLowResolution: true }
    ),
    {
      name: 'Enter your name.',
      whatsapp: 'Enter a valid WhatsApp number.',
      designChecked: 'Confirm that you checked the design.',
      lowResolutionAccepted: 'Accept the low-resolution warning to continue.',
    }
  );

  assert.deepEqual(
    validateOrderDetails(
      { name: 'Ashley', whatsapp: '0123456789', designChecked: true, lowResolutionAccepted: false },
      { hasLowResolution: false }
    ),
    {}
  );
});

test('badge validation returns caller-provided localized messages', () => {
  const image = validateImageFile(
    { name: 'photo.gif', type: 'image/gif', size: 100 },
    { unsupportedType: '请使用 JPG、PNG 或 WebP 图片。' }
  );
  const details = validateOrderDetails(
    { name: '', whatsapp: '', designChecked: false, lowResolutionAccepted: false },
    {
      hasLowResolution: true,
      messages: {
        name: '请输入姓名。',
        whatsapp: '请输入有效的 WhatsApp 号码。',
        designChecked: '请确认您已经检查设计。',
        lowResolutionAccepted: '请接受低清晰度提示。',
      },
    }
  );

  assert.equal(image.error, '请使用 JPG、PNG 或 WebP 图片。');
  assert.deepEqual(details, {
    name: '请输入姓名。',
    whatsapp: '请输入有效的 WhatsApp 号码。',
    designChecked: '请确认您已经检查设计。',
    lowResolutionAccepted: '请接受低清晰度提示。',
  });
});
