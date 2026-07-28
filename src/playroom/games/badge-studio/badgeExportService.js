import { jsPDF } from 'jspdf';
import { a4Config, badgeConfig } from './badgeStudioConfig.js';
import { mmToPx, sanitizeFileName } from './badgeStudioLogic.js';

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Could not create ${type} export.`))),
      type,
      quality
    );
  });

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('One of the badge images could not be rendered.'));
    image.src = source;
  });

const drawBadge = ({ context, design, image, centerX, centerY, diameterPx }) => {
  const transform = design.transform || {};
  const zoom = Math.max(0.2, Number(transform.zoom) || 1);
  const offsetX = (Number(transform.offsetX) || 0) * diameterPx;
  const offsetY = (Number(transform.offsetY) || 0) * diameterPx;
  const rotation = ((Number(transform.rotation) || 0) * Math.PI) / 180;
  const baseScale = Math.max(diameterPx / image.naturalWidth, diameterPx / image.naturalHeight);

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, diameterPx / 2, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = '#ffffff';
  context.fillRect(centerX - diameterPx / 2, centerY - diameterPx / 2, diameterPx, diameterPx);
  context.translate(centerX + offsetX, centerY + offsetY);
  context.rotate(rotation);
  context.scale(baseScale * zoom, baseScale * zoom);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  context.restore();

  if (a4Config.showCutOutlines) {
    context.save();
    context.beginPath();
    context.arc(centerX, centerY, diameterPx / 2, 0, Math.PI * 2);
    context.strokeStyle = '#343434';
    context.lineWidth = Math.max(1, mmToPx(0.18, badgeConfig.printDpi));
    context.stroke();
    context.restore();
  }
};

const buildOrderInfo = ({ orderId, details, designs, pages, fileNames }) => ({
  orderId,
  submittedAt: new Date().toISOString(),
  customer: {
    name: details.name.trim(),
    whatsapp: details.whatsapp.trim(),
    email: details.email?.trim() || '',
  },
  salesChannel: {
    type: details.salesChannel || 'direct',
    orderNumber: details.orderNumber?.trim() || '',
  },
  badge: {
    productSizeMm: badgeConfig.productSizeMm,
    artworkDiameterMm: badgeConfig.artworkDiameterMm,
    safeAreaDiameterMm: badgeConfig.safeAreaDiameterMm,
    totalQuantity: pages.reduce((total, page) => total + page.length, 0),
  },
  sheets: pages.map((page, index) => ({
    sheetNumber: index + 1,
    fileName: fileNames[index],
    badgeCount: page.length,
  })),
  designs: designs.map((design, index) => ({
    designNumber: index + 1,
    originalFileName: sanitizeFileName(design.imageName),
    quantity: design.quantity,
    quality: design.quality,
    transform: design.transform,
  })),
  notes: details.notes?.trim() || '',
  acknowledgements: {
    designChecked: Boolean(details.designChecked),
    lowResolutionAccepted: Boolean(details.lowResolutionAccepted),
  },
});

export const exportBadgeOrder = async ({ orderId, details, designs, pages }) => {
  const designMap = new Map(designs.map((design) => [design.id, design]));
  const images = new Map();
  await Promise.all(
    designs.map(async (design) => {
      images.set(design.id, await loadImage(design.imageUrl));
    })
  );

  const widthPx = mmToPx(a4Config.widthMm);
  const heightPx = mmToPx(a4Config.heightMm);
  const diameterPx = mmToPx(badgeConfig.artworkDiameterMm);
  const pngFiles = [];
  const pageCanvases = [];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, widthPx, heightPx);

    pages[pageIndex].forEach((entry, slotIndex) => {
      const design = designMap.get(entry.designId);
      const slot = a4Config.slots[slotIndex];
      if (!design || !slot) return;
      drawBadge({
        context,
        design,
        image: images.get(design.id),
        centerX: mmToPx(slot.xMm),
        centerY: mmToPx(slot.yMm),
        diameterPx,
      });
    });

    const fileName = `${orderId}-print-sheet-${String(pageIndex + 1).padStart(2, '0')}.png`;
    pngFiles.push({ fileName, mimeType: 'image/png', blob: await canvasToBlob(canvas, 'image/png') });
    pageCanvases.push(canvas);
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pageCanvases.forEach((canvas, index) => {
    if (index > 0) pdf.addPage('a4', 'portrait');
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });
  const pdfFile = {
    fileName: `${orderId}-badge-order.pdf`,
    mimeType: 'application/pdf',
    blob: pdf.output('blob'),
  };

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 620;
  previewCanvas.height = Math.round((620 / widthPx) * heightPx);
  previewCanvas
    .getContext('2d', { alpha: false })
    .drawImage(pageCanvases[0], 0, 0, previewCanvas.width, previewCanvas.height);
  const previewFile = {
    fileName: `${orderId}-preview.jpg`,
    mimeType: 'image/jpeg',
    blob: await canvasToBlob(previewCanvas, 'image/jpeg', 0.76),
  };

  const orderInfo = buildOrderInfo({
    orderId,
    details,
    designs,
    pages,
    fileNames: pngFiles.map((file) => file.fileName),
  });
  const jsonFile = {
    fileName: `${orderId}-order-info.json`,
    mimeType: 'application/json',
    blob: new Blob([JSON.stringify(orderInfo, null, 2)], { type: 'application/json' }),
  };

  return {
    pngFiles,
    pdfFile,
    previewFile,
    jsonFile,
    orderInfo,
    files: [...pngFiles, pdfFile, previewFile, jsonFile],
  };
};

export const downloadBlob = (file) => {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
