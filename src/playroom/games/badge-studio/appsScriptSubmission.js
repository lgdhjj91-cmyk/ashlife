const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not prepare an upload file.'));
    reader.readAsDataURL(blob);
  });

const postAction = async ({ endpoint, payload, signal }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
    redirect: 'follow',
    signal,
  });
  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error('The upload service returned an unreadable response.');
  }
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'The upload service rejected this order.');
  }
  return result;
};

export const submitBadgeOrder = async ({
  endpoint,
  appKey,
  order,
  files,
  onProgress = () => {},
  signal,
}) => {
  if (!endpoint) throw new Error('Automatic submission is not configured yet.');

  onProgress({ stage: 'starting', message: 'Starting your order…', completed: 0, total: files.length + 2 });
  await postAction({
    endpoint,
    signal,
    payload: {
      action: 'startOrder',
      appKey,
      origin: window.location.origin,
      orderId: order.orderId,
      metadata: order,
    },
  });

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    onProgress({
      stage: 'uploading',
      message: `Uploading ${file.fileName}`,
      completed: index + 1,
      total: files.length + 2,
    });
    await postAction({
      endpoint,
      signal,
      payload: {
        action: 'uploadFile',
        appKey,
        origin: window.location.origin,
        orderId: order.orderId,
        fileName: file.fileName,
        mimeType: file.mimeType,
        base64Data: await blobToBase64(file.blob),
      },
    });
  }

  onProgress({
    stage: 'finalizing',
    message: 'Finalizing your order…',
    completed: files.length + 1,
    total: files.length + 2,
  });
  const result = await postAction({
    endpoint,
    signal,
    payload: {
      action: 'completeOrder',
      appKey,
      origin: window.location.origin,
      orderId: order.orderId,
    },
  });
  onProgress({
    stage: 'complete',
    message: 'Order submitted successfully.',
    completed: files.length + 2,
    total: files.length + 2,
  });
  return result;
};
