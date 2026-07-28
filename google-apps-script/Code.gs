const ORDER_ID_PATTERN = /^ASH-\d{8}-[A-Z0-9]{6}$/;
const ALLOWED_FILES = {
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'application/pdf': ['pdf'],
  'application/json': ['json'],
};
const STATE_FILE_NAME = '.ashlife-order-state.json';

function doGet() {
  return jsonResponse_({
    success: true,
    service: 'Ashlife Badge Orders',
    submissionsEnabled: getProperty_('SUBMISSIONS_ENABLED', 'false') === 'true',
  });
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const payload = parsePayload_(event);
    assertServiceEnabled_();
    validateApplicationKey_(payload.appKey);
    validateOrigin_(payload.origin);
    validateOrderId_(payload.orderId);

    if (payload.action === 'startOrder') return jsonResponse_(startOrder_(payload));
    if (payload.action === 'uploadFile') return jsonResponse_(uploadFile_(payload));
    if (payload.action === 'completeOrder') return jsonResponse_(completeOrder_(payload));
    if (payload.action === 'checkOrder') return jsonResponse_(checkOrder_(payload));
    throw new Error('Unknown action.');
  } catch (error) {
    return jsonResponse_({ success: false, message: error.message || 'Submission failed.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function parsePayload_(event) {
  if (!event || !event.postData || !event.postData.contents) throw new Error('Missing request body.');
  try {
    return JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error('Request body must be valid JSON.');
  }
}

function assertServiceEnabled_() {
  if (getProperty_('SUBMISSIONS_ENABLED', 'false') !== 'true') {
    throw new Error('Badge submissions are temporarily unavailable.');
  }
}

function validateApplicationKey_(key) {
  const expected = getProperty_('APP_SHARED_SECRET', '');
  if (!expected || String(key || '') !== expected) throw new Error('Invalid application key.');
}

function validateOrigin_(origin) {
  const allowed = getProperty_('ALLOWED_ORIGIN', '');
  if (allowed && String(origin || '').replace(/\/$/, '') !== allowed.replace(/\/$/, '')) {
    throw new Error('This website origin is not allowed.');
  }
}

function validateOrderId_(orderId) {
  if (!ORDER_ID_PATTERN.test(String(orderId || ''))) throw new Error('Invalid order ID.');
}

function startOrder_(payload) {
  enforceStartRateLimit_();
  if (!payload.metadata || !payload.metadata.customer || !payload.metadata.customer.name) {
    throw new Error('Customer details are incomplete.');
  }
  if (!payload.metadata.customer.whatsapp) throw new Error('WhatsApp number is required.');

  const folder = getOrderFolder_(payload.orderId, true);
  const state = readState_(folder);
  if (state && state.status === 'complete') throw new Error('This order was already completed.');
  if (state && state.orderId === payload.orderId) {
    return { success: true, orderId: payload.orderId, message: 'Order already started.' };
  }

  writeState_(folder, {
    orderId: payload.orderId,
    status: 'uploading',
    startedAt: new Date().toISOString(),
    uploadedFiles: [],
    metadata: payload.metadata,
  });
  return { success: true, orderId: payload.orderId, message: 'Order started.' };
}

function uploadFile_(payload) {
  const folder = getOrderFolder_(payload.orderId, false);
  if (!folder) throw new Error('Start the order before uploading files.');
  const state = readState_(folder);
  if (!state || state.status === 'complete') throw new Error('This order is not accepting files.');

  const fileName = sanitizeFileName_(payload.fileName);
  validateUploadFile_(fileName, payload.mimeType, payload.base64Data);
  const existing = folder.getFilesByName(fileName);
  if (existing.hasNext()) {
    return { success: true, orderId: payload.orderId, message: 'File already uploaded.' };
  }

  const maxFiles = Number(getProperty_('MAX_FILES_PER_ORDER', '12'));
  if (state.uploadedFiles.length >= maxFiles) throw new Error('This order has too many files.');

  const bytes = Utilities.base64Decode(payload.base64Data);
  folder.createFile(Utilities.newBlob(bytes, payload.mimeType, fileName));
  state.uploadedFiles.push({
    fileName: fileName,
    mimeType: payload.mimeType,
    size: bytes.length,
    uploadedAt: new Date().toISOString(),
  });
  writeState_(folder, state);
  return { success: true, orderId: payload.orderId, message: 'File uploaded.' };
}

function completeOrder_(payload) {
  const folder = getOrderFolder_(payload.orderId, false);
  if (!folder) throw new Error('Order folder was not found.');
  const state = readState_(folder);
  if (!state) throw new Error('Order state was not found.');
  if (state.status === 'complete') {
    return { success: true, orderId: payload.orderId, message: 'Order submitted successfully' };
  }

  const mimeTypes = state.uploadedFiles.map(function (file) { return file.mimeType; });
  if (mimeTypes.indexOf('application/pdf') === -1) throw new Error('The print PDF is missing.');
  if (mimeTypes.indexOf('image/png') === -1) throw new Error('A print PNG is missing.');
  if (mimeTypes.indexOf('application/json') === -1) throw new Error('Order information is missing.');

  state.status = 'complete';
  state.completedAt = new Date().toISOString();
  writeState_(folder, state);
  return { success: true, orderId: payload.orderId, message: 'Order submitted successfully' };
}

function checkOrder_(payload) {
  const folder = getOrderFolder_(payload.orderId, false);
  if (!folder) return { success: true, orderId: payload.orderId, status: 'missing' };
  const state = readState_(folder);
  return {
    success: true,
    orderId: payload.orderId,
    status: state ? state.status : 'unknown',
    uploadedFileCount: state ? state.uploadedFiles.length : 0,
  };
}

function validateUploadFile_(fileName, mimeType, base64Data) {
  const extension = fileName.split('.').pop().toLowerCase();
  const allowedExtensions = ALLOWED_FILES[mimeType] || [];
  if (allowedExtensions.indexOf(extension) === -1) throw new Error('File type is not allowed.');
  if (!base64Data || !/^[A-Za-z0-9+/=]+$/.test(base64Data)) throw new Error('File data is invalid.');
  const estimatedSize = Math.floor((base64Data.length * 3) / 4);
  const maxSize = Number(getProperty_('MAX_FILE_SIZE_BYTES', '25000000'));
  if (estimatedSize > maxSize) throw new Error('File is larger than the configured upload limit.');
}

function getOrderFolder_(orderId, createIfMissing) {
  const parentId = getProperty_('DRIVE_PARENT_FOLDER_ID', '');
  if (!parentId) throw new Error('Drive parent folder is not configured.');
  const parent = DriveApp.getFolderById(parentId);
  const datePart = orderId.split('-')[1];
  const year = datePart.slice(0, 4);
  const monthNumber = Number(datePart.slice(4, 6));
  const monthName = Utilities.formatDate(
    new Date(Number(year), monthNumber - 1, 1),
    Session.getScriptTimeZone(),
    'MM - MMMM'
  );
  const yearFolder = getChildFolder_(parent, year, createIfMissing);
  if (!yearFolder) return null;
  const monthFolder = getChildFolder_(yearFolder, monthName, createIfMissing);
  if (!monthFolder) return null;
  return getChildFolder_(monthFolder, orderId, createIfMissing);
}

function getChildFolder_(parent, name, createIfMissing) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return createIfMissing ? parent.createFolder(name) : null;
}

function readState_(folder) {
  const files = folder.getFilesByName(STATE_FILE_NAME);
  if (!files.hasNext()) return null;
  try {
    return JSON.parse(files.next().getBlob().getDataAsString());
  } catch (error) {
    throw new Error('Stored order state is unreadable.');
  }
}

function writeState_(folder, state) {
  const files = folder.getFilesByName(STATE_FILE_NAME);
  while (files.hasNext()) files.next().setTrashed(true);
  folder.createFile(STATE_FILE_NAME, JSON.stringify(state, null, 2), MimeType.PLAIN_TEXT);
}

function enforceStartRateLimit_() {
  const cache = CacheService.getScriptCache();
  const key = 'starts-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHH');
  const current = Number(cache.get(key) || '0');
  const limit = Number(getProperty_('MAX_ORDER_STARTS_PER_HOUR', '30'));
  if (current >= limit) throw new Error('Too many new orders. Please try again later.');
  cache.put(key, String(current + 1), 3600);
}

function sanitizeFileName_(value) {
  const fileName = String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^\.+/, '');
  if (!fileName || fileName.length > 160) throw new Error('Invalid file name.');
  return fileName;
}

function getProperty_(name, fallback) {
  return PropertiesService.getScriptProperties().getProperty(name) || fallback;
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
