import { allowedImageTypes, badgeConfig } from './badgeStudioConfig.js';

const ORDER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const mmToPx = (millimetres, dpi = badgeConfig.printDpi) =>
  Math.round((Number(millimetres) / 25.4) * Number(dpi));

export const getCoverTransform = ({ imageWidth, imageHeight, frameSize }) => {
  const scale = Math.max(frameSize / imageWidth, frameSize / imageHeight);
  return {
    x: (frameSize - imageWidth * scale) / 2,
    y: (frameSize - imageHeight * scale) / 2,
    scale,
    rotation: 0,
  };
};

export const classifyImageQuality = ({
  width,
  height,
  artworkDiameterMm = badgeConfig.artworkDiameterMm,
  dpi = badgeConfig.printDpi,
  scale = 1,
}) => {
  const requiredPixels = mmToPx(artworkDiameterMm, dpi);
  const usablePixels = Math.min(Number(width), Number(height)) / Math.max(Number(scale) || 1, 0.01);
  const ratio = usablePixels / requiredPixels;
  if (ratio >= 1) return 'good';
  if (ratio >= 0.7) return 'acceptable';
  return 'low';
};

export const expandDesignQuantities = (designs) =>
  designs.flatMap((design) =>
    Array.from(
      { length: Math.max(0, Math.floor(Number(design.quantity) || 0)) },
      (_, index) => ({
        designId: design.id,
        instanceId: `${design.id}-${index + 1}`,
      })
    )
  );

export const paginateSlots = (entries, slotsPerSheet) => {
  const pages = [];
  for (let index = 0; index < entries.length; index += slotsPerSheet) {
    pages.push(entries.slice(index, index + slotsPerSheet));
  }
  return pages;
};

export const moveSlot = (entries, index, direction) => {
  const target = index + direction;
  if (index < 0 || index >= entries.length || target < 0 || target >= entries.length) return entries;
  const next = [...entries];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const createOrderId = ({ now = new Date(), randomValues } = {}) => {
  const values = randomValues || Array.from({ length: 6 }, () => Math.random());
  const suffix = Array.from({ length: 6 }, (_, index) => {
    const value = Math.min(0.999999, Math.max(0, Number(values[index]) || 0));
    return ORDER_ALPHABET[Math.floor(value * ORDER_ALPHABET.length)];
  }).join('');
  return `ASH-${formatLocalDate(now)}-${suffix}`;
};

export const sanitizeFileName = (value) => {
  const raw = String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/^\.+/, '')
    .replace(/[<>:"/\\|?*#]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return raw || 'file';
};

export const validateImageFile = (file) => {
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  const validExtensions = allowedImageTypes[file?.type] || [];

  if (!validExtensions.includes(extension)) {
    return { valid: false, error: 'Use a JPG, PNG, or WebP image.' };
  }
  if (Number(file?.size) > badgeConfig.maxImageBytes) {
    return { valid: false, error: 'This image is larger than 15 MB.' };
  }
  return { valid: true, error: '' };
};

export const normalizeMalaysianPhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `60${digits.slice(1)}`;
  if (!/^60\d{8,10}$/.test(digits)) return '';
  return digits;
};

export const validateOrderDetails = (details, { hasLowResolution = false } = {}) => {
  const errors = {};
  if (!String(details?.name || '').trim()) errors.name = 'Enter your name.';
  if (!normalizeMalaysianPhone(details?.whatsapp)) errors.whatsapp = 'Enter a valid WhatsApp number.';
  if (!details?.designChecked) errors.designChecked = 'Confirm that you checked the design.';
  if (hasLowResolution && !details?.lowResolutionAccepted) {
    errors.lowResolutionAccepted = 'Accept the low-resolution warning to continue.';
  }
  return errors;
};
