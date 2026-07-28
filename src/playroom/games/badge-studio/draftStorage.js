const DATABASE_NAME = 'ashlife-badge-studio';
const DATABASE_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current';

const openDatabase = () =>
  new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB is unavailable.'));
      return;
    }

    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open draft storage.'));
  });

const runTransaction = async (mode, action) => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Draft storage operation failed.'));
    });
  } finally {
    database.close();
  }
};

export const saveBadgeDraft = async ({ designs, ...rest }) => {
  const savedDesigns = designs.map((design) => {
    const savedDesign = { ...design };
    delete savedDesign.imageUrl;
    return savedDesign;
  });
  await runTransaction('readwrite', (store) =>
    store.put(
      {
        ...rest,
        designs: savedDesigns,
        savedAt: new Date().toISOString(),
      },
      DRAFT_KEY
    )
  );
};

export const loadBadgeDraft = async () => {
  const draft = await runTransaction('readonly', (store) => store.get(DRAFT_KEY));
  if (!draft) return null;
  return {
    ...draft,
    designs: draft.designs.map((design) => ({
      ...design,
      imageUrl: design.imageBlob ? URL.createObjectURL(design.imageBlob) : '',
    })),
  };
};

export const clearBadgeDraft = () => runTransaction('readwrite', (store) => store.delete(DRAFT_KEY));
