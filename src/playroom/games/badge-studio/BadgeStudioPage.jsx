import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileImage,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import A4SheetPreview from './components/A4SheetPreview';
import BadgeArtwork from './components/BadgeArtwork';
import BadgeCanvas from './components/BadgeCanvas';
import DesignCollection from './components/DesignCollection';
import { submitBadgeOrder } from './appsScriptSubmission';
import { downloadBlob, exportBadgeOrder } from './badgeExportService';
import { a4Config, badgeConfig, studioSteps } from './badgeStudioConfig';
import {
  classifyImageQuality,
  createOrderId,
  expandDesignQuantities,
  moveSlot,
  normalizeMalaysianPhone,
  paginateSlots,
  validateImageFile,
  validateOrderDetails,
} from './badgeStudioLogic';
import { clearBadgeDraft, loadBadgeDraft, saveBadgeDraft } from './draftStorage';
import './badge-studio.css';

const EMPTY_DETAILS = {
  name: '',
  whatsapp: '',
  email: '',
  salesChannel: 'direct',
  orderNumber: '',
  notes: '',
  designChecked: false,
  lowResolutionAccepted: false,
  honeypot: '',
};

const createDesignId = () =>
  `badge-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

const readImage = (file) =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({
        imageUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error(`${file.name} could not be opened as an image.`));
    };
    image.src = imageUrl;
  });

const makeDesign = async (file) => {
  const image = await readImage(file);
  return {
    id: createDesignId(),
    imageName: file.name,
    imageBlob: file,
    imageUrl: image.imageUrl,
    width: image.width,
    height: image.height,
    quantity: 1,
    quality: classifyImageQuality({
      width: image.width,
      height: image.height,
      artworkDiameterMm: badgeConfig.artworkDiameterMm,
      dpi: badgeConfig.printDpi,
      scale: 1,
    }),
    transform: {
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
      rotation: 0,
    },
  };
};

const BadgeStudioPage = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [designs, setDesigns] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [arrangedEntries, setArrangedEntries] = useState([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [formErrors, setFormErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [draftStatus, setDraftStatus] = useState('New project');
  const [isRestoring, setIsRestoring] = useState(true);
  const [orderId, setOrderId] = useState('');
  const [exportBundle, setExportBundle] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [submission, setSubmission] = useState({ status: 'idle', message: '', completed: 0, total: 1 });
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceIdRef = useRef('');
  const designsRef = useRef(designs);
  const abortRef = useRef(null);

  designsRef.current = designs;

  const activeDesign = designs.find((design) => design.id === activeId) || designs[0];
  const pages = useMemo(
    () => paginateSlots(arrangedEntries, a4Config.slotsPerSheet),
    [arrangedEntries]
  );
  const totalQuantity = arrangedEntries.length;
  const hasLowResolution = designs.some((design) => design.quality === 'low');
  const endpoint = import.meta.env.VITE_BADGE_UPLOAD_ENDPOINT || '';
  const appKey = import.meta.env.VITE_BADGE_APP_KEY || '';
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';

  useEffect(() => {
    document.body.classList.add('badge-studio-active');
    const hiddenChatContainers = new Set();
    const hideChatWidgets = () => {
      document.querySelectorAll('iframe').forEach((frame) => {
        if (
          frame.style.position !== 'fixed' ||
          !frame.parentElement ||
          frame.parentElement.parentElement !== document.body
        ) return;
        hiddenChatContainers.add(frame.parentElement);
        frame.parentElement.style.setProperty('display', 'none', 'important');
      });
    };
    hideChatWidgets();
    const observer = new MutationObserver(hideChatWidgets);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      hiddenChatContainers.forEach((container) => container.style.removeProperty('display'));
      document.body.classList.remove('badge-studio-active');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadBadgeDraft()
      .then((draft) => {
        if (cancelled || !draft?.designs?.length) return;
        setDesigns(draft.designs);
        setActiveId(draft.activeId || draft.designs[0].id);
        setArrangedEntries(
          draft.arrangedEntries?.length ? draft.arrangedEntries : expandDesignQuantities(draft.designs)
        );
        setDetails({ ...EMPTY_DETAILS, ...draft.details });
        setStepIndex(Math.min(Number(draft.stepIndex) || 0, 3));
        setOrderId(draft.orderId || '');
        setDraftStatus('Draft restored');
      })
      .catch(() => setDraftStatus('Draft saving unavailable'))
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });
    return () => {
      cancelled = true;
      designsRef.current.forEach((design) => {
        if (design.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(design.imageUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (isRestoring || designs.length === 0) return undefined;
    setDraftStatus('Saving…');
    const timer = window.setTimeout(() => {
      saveBadgeDraft({
        designs,
        activeId,
        arrangedEntries,
        details,
        stepIndex,
        orderId,
      })
        .then(() => setDraftStatus('Draft saved'))
        .catch(() => setDraftStatus('Draft saving unavailable'));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [activeId, arrangedEntries, designs, details, isRestoring, orderId, stepIndex]);

  useEffect(() => {
    if (sheetIndex > pages.length - 1) setSheetIndex(Math.max(0, pages.length - 1));
  }, [pages.length, sheetIndex]);

  const addFiles = async (fileList, replacingId = '') => {
    const incoming = [...fileList];
    setNotice('');
    if (!replacingId && designs.length + incoming.length > badgeConfig.maxImages) {
      setNotice(`You can use up to ${badgeConfig.maxImages} photos in one project.`);
      return;
    }

    const validFiles = [];
    for (const file of incoming) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setNotice(`${file.name}: ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    }
    if (!validFiles.length) return;

    try {
      if (replacingId) {
        const replacement = await makeDesign(validFiles[0]);
        const next = designs.map((design) => {
          if (design.id !== replacingId) return design;
          if (design.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(design.imageUrl);
          return { ...replacement, id: replacingId, quantity: design.quantity };
        });
        setDesigns(next);
        setArrangedEntries(expandDesignQuantities(next));
        setActiveId(replacingId);
      } else {
        const created = [];
        for (const file of validFiles) created.push(await makeDesign(file));
        const next = [...designs, ...created];
        setDesigns(next);
        setArrangedEntries(expandDesignQuantities(next));
        setActiveId(activeId || created[0].id);
        setStepIndex(next.length ? 1 : 0);
      }
    } catch (error) {
      setNotice(error.message);
    }
  };

  const updateDesign = (id, patch) => {
    setDesigns((current) =>
      current.map((design) => (design.id === id ? { ...design, ...patch } : design))
    );
    setExportBundle(null);
  };

  const updateTransform = (transform) => {
    if (!activeDesign) return;
    updateDesign(activeDesign.id, {
      transform,
      quality: classifyImageQuality({
        width: activeDesign.width,
        height: activeDesign.height,
        artworkDiameterMm: badgeConfig.artworkDiameterMm,
        dpi: badgeConfig.printDpi,
        scale: transform.zoom,
      }),
    });
  };

  const setQuantity = (id, requested) => {
    const design = designs.find((item) => item.id === id);
    if (!design) return;
    const quantity = Math.max(1, Math.min(badgeConfig.maxQuantityPerDesign, requested));
    const nextTotal = totalQuantity - design.quantity + quantity;
    if (nextTotal > badgeConfig.maxTotalBadges) {
      setNotice(`One project can contain up to ${badgeConfig.maxTotalBadges} badges.`);
      return;
    }
    const next = designs.map((item) => (item.id === id ? { ...item, quantity } : item));
    setDesigns(next);
    setArrangedEntries(expandDesignQuantities(next));
    setExportBundle(null);
  };

  const duplicateDesign = (id) => {
    if (totalQuantity >= badgeConfig.maxTotalBadges || designs.length >= badgeConfig.maxImages) {
      setNotice('This project has reached its design or badge limit.');
      return;
    }
    const source = designs.find((design) => design.id === id);
    if (!source) return;
    const duplicate = {
      ...source,
      id: createDesignId(),
      imageUrl: URL.createObjectURL(source.imageBlob),
      quantity: 1,
      transform: { ...source.transform },
    };
    const next = [...designs, duplicate];
    setDesigns(next);
    setArrangedEntries(expandDesignQuantities(next));
    setActiveId(duplicate.id);
    setExportBundle(null);
  };

  const deleteDesign = (id) => {
    const removed = designs.find((design) => design.id === id);
    if (removed?.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(removed.imageUrl);
    const next = designs.filter((design) => design.id !== id);
    setDesigns(next);
    setArrangedEntries(expandDesignQuantities(next));
    setActiveId(next[0]?.id || '');
    setStepIndex(next.length ? stepIndex : 0);
    setExportBundle(null);
  };

  const prepareExports = async () => {
    if (!pages.length) return null;
    setIsPreparing(true);
    setNotice('');
    try {
      const stableOrderId = orderId || createOrderId();
      if (!orderId) setOrderId(stableOrderId);
      const bundle = await exportBadgeOrder({
        orderId: stableOrderId,
        details: { ...details, whatsapp: normalizeMalaysianPhone(details.whatsapp) },
        designs,
        pages,
      });
      setExportBundle(bundle);
      return bundle;
    } catch (error) {
      setNotice(error.message || 'The print files could not be prepared.');
      return null;
    } finally {
      setIsPreparing(false);
    }
  };

  const goForward = async () => {
    setNotice('');
    if (stepIndex === 0 && !designs.length) {
      setNotice('Add at least one photo to start your badge collection.');
      return;
    }
    if (stepIndex === 3) {
      if (details.honeypot) return;
      const errors = validateOrderDetails(details, { hasLowResolution });
      setFormErrors(errors);
      if (Object.keys(errors).length) return;
      setStepIndex(4);
      await prepareExports();
      return;
    }
    setStepIndex((current) => Math.min(4, current + 1));
  };

  const submitOrder = async () => {
    const bundle = exportBundle || (await prepareExports());
    if (!bundle) return;
    abortRef.current = new AbortController();
    setSubmission({ status: 'working', message: 'Starting your order…', completed: 0, total: bundle.files.length + 2 });
    try {
      await submitBadgeOrder({
        endpoint,
        appKey,
        order: bundle.orderInfo,
        files: bundle.files,
        signal: abortRef.current.signal,
        onProgress: (progress) =>
          setSubmission({
            status: progress.stage === 'complete' ? 'complete' : 'working',
            ...progress,
          }),
      });
      await clearBadgeDraft().catch(() => undefined);
    } catch (error) {
      if (error.name === 'AbortError') {
        setSubmission({ status: 'idle', message: 'Upload cancelled.', completed: 0, total: 1 });
      } else {
        setSubmission({ status: 'error', message: error.message, completed: 0, total: 1 });
      }
    }
  };

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi Ashlife, I have completed my badge design.\n\nOrder ID: ${orderId || 'Not submitted yet'}\nBadge size: 58 mm\nQuantity: ${totalQuantity}\nA4 sheets: ${pages.length}\nCustomer name: ${details.name || '-'}\n\nPlease help me check the design and confirm the order. Thank you.`
  )}`;

  const renderUpload = () => (
    <section className="badge-upload-step">
      <div
        className="badge-upload-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <div className="badge-upload-icon"><Upload size={34} /></div>
        <h2>Upload your photos</h2>
        <p>Each photo becomes one badge design automatically. You can adjust and duplicate it next.</p>
        <button type="button" className="badge-primary-button" onClick={() => fileInputRef.current?.click()}>
          <FileImage size={19} />Choose photos
        </button>
        <span>JPG, PNG or WebP · up to 20 photos · 15 MB each</span>
      </div>
      <div className="badge-privacy-note">
        <ShieldCheck size={24} />
        <div>
          <strong>Your photos stay on this device while you design.</strong>
          <p>Only completed print files, the preview, and order details are sent when you choose Submit.</p>
        </div>
      </div>
      {designs.length > 0 && (
        <div className="badge-uploaded-strip">
          {designs.map((design) => <BadgeArtwork design={design} key={design.id} />)}
        </div>
      )}
    </section>
  );

  const renderCustomize = () => (
    <div className="badge-workbench">
      {activeDesign && (
        <BadgeCanvas
          design={activeDesign}
          onTransform={updateTransform}
          onReset={() =>
            updateTransform({ offsetX: 0, offsetY: 0, zoom: 1, rotation: 0 })
          }
          onReplace={() => {
            replaceIdRef.current = activeDesign.id;
            replaceInputRef.current?.click();
          }}
        />
      )}
      <DesignCollection
        designs={designs}
        activeId={activeDesign?.id}
        onSelect={setActiveId}
        onDuplicate={duplicateDesign}
        onDelete={deleteDesign}
        onQuantity={setQuantity}
        onAddPhotos={() => fileInputRef.current?.click()}
        totalQuantity={totalQuantity}
        maxTotal={badgeConfig.maxTotalBadges}
      />
    </div>
  );

  const renderArrange = () => (
    <div className="badge-arrange-layout">
      <div className="badge-arrange-copy">
        <h2>Arrange your print sheets</h2>
        <p>Quantities are filled automatically. Use the arrows on a badge to swap its print order.</p>
        <div className="badge-sheet-stats">
          <span><strong>{totalQuantity}</strong> badges</span>
          <span><strong>{pages.length}</strong> A4 sheet{pages.length === 1 ? '' : 's'}</span>
          <span><strong>{badgeConfig.artworkDiameterMm} mm</strong> artwork</span>
        </div>
        <div className="badge-sheet-tabs" aria-label="Print sheet selection">
          {pages.map((_, index) => (
            <button
              type="button"
              className={sheetIndex === index ? 'active' : ''}
              onClick={() => setSheetIndex(index)}
              key={index}
            >
              Sheet {index + 1}
            </button>
          ))}
        </div>
        <p className="badge-calibration-note">
          The default uses 8 non-overlapping 70 mm circles. Print one test at 100% scale before production.
        </p>
      </div>
      {pages[sheetIndex] && (
        <A4SheetPreview
          page={pages[sheetIndex]}
          pageIndex={sheetIndex}
          pageCount={pages.length}
          designs={designs}
          globalOffset={sheetIndex * a4Config.slotsPerSheet}
          onMove={(index, direction) => {
            setArrangedEntries((entries) => moveSlot(entries, index, direction));
            setExportBundle(null);
          }}
        />
      )}
    </div>
  );

  const renderDetails = () => (
    <section className="badge-details-step">
      <div className="badge-details-heading">
        <h2>Who is this badge collection for?</h2>
        <p>These details help Ashlife match your print files with your WhatsApp order.</p>
      </div>
      <div className="badge-order-form">
        <label>
          <span>Name *</span>
          <input value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} />
          {formErrors.name && <small className="field-error">{formErrors.name}</small>}
        </label>
        <label>
          <span>WhatsApp number *</span>
          <input
            inputMode="tel"
            placeholder="012 345 6789"
            value={details.whatsapp}
            onChange={(event) => setDetails({ ...details, whatsapp: event.target.value })}
          />
          {formErrors.whatsapp && <small className="field-error">{formErrors.whatsapp}</small>}
        </label>
        <label>
          <span>Email (optional)</span>
          <input type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} />
        </label>
        <label>
          <span>Order type</span>
          <select value={details.salesChannel} onChange={(event) => setDetails({ ...details, salesChannel: event.target.value })}>
            <option value="direct">Direct / WhatsApp</option>
            <option value="shopee">Shopee</option>
            <option value="tiktok">TikTok Shop</option>
            <option value="pickup">Store pickup</option>
          </select>
        </label>
        {['shopee', 'tiktok'].includes(details.salesChannel) && (
          <label className="wide">
            <span>Marketplace order number</span>
            <input value={details.orderNumber} onChange={(event) => setDetails({ ...details, orderNumber: event.target.value })} />
          </label>
        )}
        <label className="wide">
          <span>Notes (optional)</span>
          <textarea rows="4" value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} />
        </label>
        <label className="badge-honeypot" aria-hidden="true">
          <span>Website</span>
          <input tabIndex="-1" autoComplete="off" value={details.honeypot} onChange={(event) => setDetails({ ...details, honeypot: event.target.value })} />
        </label>
      </div>
      <div className="badge-confirmations">
        <label>
          <input type="checkbox" checked={details.designChecked} onChange={(event) => setDetails({ ...details, designChecked: event.target.checked })} />
          <span>I checked every badge and kept important details inside the safe circle.</span>
        </label>
        {formErrors.designChecked && <small className="field-error">{formErrors.designChecked}</small>}
        {hasLowResolution && (
          <>
            <label className="warning">
              <input type="checkbox" checked={details.lowResolutionAccepted} onChange={(event) => setDetails({ ...details, lowResolutionAccepted: event.target.checked })} />
              <span>I understand that low-resolution photos may look blurry when printed.</span>
            </label>
            {formErrors.lowResolutionAccepted && <small className="field-error">{formErrors.lowResolutionAccepted}</small>}
          </>
        )}
      </div>
    </section>
  );

  const renderFinish = () => {
    const progress = submission.total ? Math.round((submission.completed / submission.total) * 100) : 0;
    return (
      <section className="badge-finish-step">
        <div className={`badge-finish-mark${submission.status === 'complete' ? ' complete' : ''}`}>
          {submission.status === 'complete' ? <Check size={34} /> : <Sparkles size={34} />}
        </div>
        <h2>{submission.status === 'complete' ? 'Your badge design was submitted!' : 'Your print files are ready'}</h2>
        <p className="badge-order-id">{orderId}</p>
        <p>{totalQuantity} badges · {pages.length} A4 sheet{pages.length === 1 ? '' : 's'}</p>

        {isPreparing && <div className="badge-preparing"><LoaderCircle size={22} />Preparing 300 DPI print files…</div>}
        {exportBundle && (
          <div className="badge-download-grid">
            <button type="button" onClick={() => downloadBlob(exportBundle.pdfFile)}><Download size={19} />Print PDF</button>
            {exportBundle.pngFiles.map((file, index) => (
              <button type="button" onClick={() => downloadBlob(file)} key={file.fileName}>
                <Download size={19} />A4 PNG {index + 1}
              </button>
            ))}
            <button type="button" onClick={() => downloadBlob(exportBundle.previewFile)}><Download size={19} />Preview JPG</button>
            <button type="button" onClick={() => downloadBlob(exportBundle.jsonFile)}><Download size={19} />Order info</button>
          </div>
        )}

        {submission.status === 'working' && (
          <div className="badge-submission-progress">
            <div><span style={{ width: `${progress}%` }} /></div>
            <p>{submission.message}</p>
            <button type="button" onClick={() => abortRef.current?.abort()}>Cancel upload</button>
          </div>
        )}
        {submission.status === 'error' && (
          <div className="badge-submit-error">
            <AlertCircle size={20} />
            <div><strong>Automatic upload did not finish.</strong><p>{submission.message}</p></div>
          </div>
        )}

        <div className="badge-finish-actions">
          {endpoint && submission.status !== 'complete' && submission.status !== 'working' && (
            <button type="button" className="badge-primary-button" onClick={submitOrder}>
              <Upload size={19} />{submission.status === 'error' ? 'Retry Drive upload' : 'Submit to Ashlife'}
            </button>
          )}
          {!endpoint && (
            <p className="badge-endpoint-note">
              Automatic Drive submission is not configured yet. Download the PDF and send it through WhatsApp.
            </p>
          )}
          <a className="badge-whatsapp-button" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={20} />Contact Ashlife on WhatsApp
          </a>
        </div>
      </section>
    );
  };

  const stepContent = [renderUpload, renderCustomize, renderArrange, renderDetails, renderFinish][stepIndex]();

  if (isRestoring) {
    return (
      <main className="page badge-studio-page">
        <div className="badge-studio-loading"><LoaderCircle size={30} />Opening your craft table…</div>
      </main>
    );
  }

  return (
    <main className="page badge-studio-page animate-fade-in">
      <div className="badge-studio-shell">
        <header className="badge-studio-header">
          <Link to="/play/" className="badge-back-link"><ArrowLeft size={18} />Back to Playroom</Link>
          <div>
            <h1>Badge Studio</h1>
            <p>Design your own 58 mm badges, then build a print-ready A4 sheet.</p>
          </div>
          <span className="badge-draft-status"><CheckCircle2 size={17} />{draftStatus}</span>
        </header>

        <nav className="badge-step-rail" aria-label="Badge Studio progress">
          {studioSteps.map((step, index) => (
            <button
              type="button"
              key={step.id}
              className={`${index === stepIndex ? 'active' : ''}${index < stepIndex ? ' complete' : ''}`}
              onClick={() => {
                if (index <= stepIndex || (index <= 3 && designs.length)) setStepIndex(index);
              }}
              aria-current={index === stepIndex ? 'step' : undefined}
            >
              <span>{index < stepIndex ? <Check size={16} /> : index + 1}</span>
              {step.label}
            </button>
          ))}
        </nav>

        {notice && <div className="badge-notice"><AlertCircle size={19} />{notice}</div>}
        {stepContent}

        {stepIndex < 4 && (
          <footer className="badge-studio-actionbar">
            <button
              type="button"
              className="badge-secondary-button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
            >
              <ArrowLeft size={18} />Back
            </button>
            <div className="badge-action-summary">
              <strong>{totalQuantity} badge{totalQuantity === 1 ? '' : 's'}</strong>
              <span>{Math.max(1, pages.length)} A4 sheet{pages.length === 1 ? '' : 's'}</span>
            </div>
            <button type="button" className="badge-primary-button" onClick={goForward}>
              {stepIndex === 3 ? 'Prepare print files' : studioSteps[stepIndex + 1].label}
              <ArrowRight size={18} />
            </button>
          </footer>
        )}

        <input
          ref={fileInputRef}
          className="badge-hidden-input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <input
          ref={replaceInputRef}
          className="badge-hidden-input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(event) => {
            addFiles(event.target.files, replaceIdRef.current);
            event.target.value = '';
          }}
        />
      </div>
    </main>
  );
};

export default BadgeStudioPage;
