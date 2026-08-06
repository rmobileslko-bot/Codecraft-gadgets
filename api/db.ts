import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export interface ServerSettings {
  geminiApiKey?: string;
  firebaseConfig?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  } | null;
  smtpConfig?: {
    user?: string;
    pass?: string;
    host?: string;
    port?: number;
  } | null;
}

// In-memory fallback store seeded with initial defaults
const memoryStore: {
  settings: ServerSettings;
  newsPosts: any[];
  newsletterSubscribers: any[];
  priceAlerts: any[];
  customProducts: any[];
  deletedProducts: string[];
} = {
  settings: {
    geminiApiKey: 'AQ.Ab8RN6I78OvfG9mgKHxCGtVO0nNYDxgTyaMfgaJodQ9QO8SLnw',
    firebaseConfig: null,
    smtpConfig: null,
  },
  newsPosts: [],
  newsletterSubscribers: [],
  priceAlerts: [],
  customProducts: [],
  deletedProducts: [],
};

const DATA_FILE = path.join(process.cwd(), 'data-store.json');
const TMP_DATA_FILE = path.join('/tmp', 'data-store.json');

function loadMemoryFromFile() {
  try {
    const fileToLoad = fs.existsSync(TMP_DATA_FILE) ? TMP_DATA_FILE : (fs.existsSync(DATA_FILE) ? DATA_FILE : null);
    if (fileToLoad) {
      const raw = fs.readFileSync(fileToLoad, 'utf-8');
      const data = JSON.parse(raw);
      if (data) {
        if (data.settings) memoryStore.settings = { ...memoryStore.settings, ...data.settings };
        if (Array.isArray(data.newsPosts)) memoryStore.newsPosts = data.newsPosts;
        if (Array.isArray(data.newsletterSubscribers)) memoryStore.newsletterSubscribers = data.newsletterSubscribers;
        if (Array.isArray(data.priceAlerts)) memoryStore.priceAlerts = data.priceAlerts;
        if (Array.isArray(data.customProducts)) memoryStore.customProducts = data.customProducts;
        if (Array.isArray(data.deletedProducts)) memoryStore.deletedProducts = data.deletedProducts;
      }
    }
  } catch (err) {
    console.error('Failed to load memory store from file:', err);
  }
}

function saveMemoryToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err: any) {
    if (err?.code === 'EROFS') {
      try {
        fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
      } catch (tmpErr) {
        // ignore
      }
    } else {
      console.error('Failed to save memory store to file:', err);
    }
  }
}

// Load persisted data from disk on boot
loadMemoryFromFile();

let isFirestoreDisabled = false;

function handleFirestoreError(e: any, operationName: string) {
  const msg = String(e?.message || e);
  if (
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('permission') ||
    msg.includes('disabled') ||
    msg.includes('not been used') ||
    msg.includes('NOT_FOUND') ||
    msg.includes('invalid')
  ) {
    console.info(`Firestore unavailable for '${operationName}': seamlessly falling back to local store.`);
  } else {
    console.warn(`Firestore operation '${operationName}' failed:`, msg);
  }
  isFirestoreDisabled = true;
}

function getDb(): Firestore | null {
  if (isFirestoreDisabled) {
    return null;
  }
  try {
    const config = memoryStore.settings.firebaseConfig ||
      (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null);

    // Validate projectId - if missing or looks like an email address, disable Firestore
    if (!config || !config.projectId || config.projectId.includes('@')) {
      return null;
    }

    let app: FirebaseApp;
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    return getFirestore(app);
  } catch (err) {
    handleFirestoreError(err, 'init');
    return null;
  }
}

export async function getServerSettings(): Promise<ServerSettings> {
  const db = getDb();
  if (db) {
    try {
      const docRef = doc(db, 'settings', 'server_settings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ServerSettings;
        if (data.geminiApiKey) {
          process.env.GEMINI_API_KEY = data.geminiApiKey;
        }
        memoryStore.settings = { ...memoryStore.settings, ...data };
        return memoryStore.settings;
      }
    } catch (e) {
      handleFirestoreError(e, 'getServerSettings');
    }
  }
  if (memoryStore.settings.geminiApiKey) {
    process.env.GEMINI_API_KEY = memoryStore.settings.geminiApiKey;
  }
  return memoryStore.settings;
}

export async function saveServerSettings(newSettings: Partial<ServerSettings>): Promise<ServerSettings> {
  const current = await getServerSettings();
  const updated: ServerSettings = {
    ...current,
    ...newSettings
  };
  if (newSettings.firebaseConfig === null) {
    updated.firebaseConfig = null;
  }
  memoryStore.settings = updated;
  if (updated.geminiApiKey) {
    process.env.GEMINI_API_KEY = updated.geminiApiKey;
  }
  saveMemoryToFile();

  const db = getDb();
  if (db) {
    try {
      const docRef = doc(db, 'settings', 'server_settings');
      await setDoc(docRef, updated, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'saveServerSettings');
    }
  }
  return updated;
}

export async function getNewsPosts(): Promise<any[]> {
  const db = getDb();
  if (db) {
    try {
      const colRef = collection(db, 'gadget_news');
      const snap = await getDocs(colRef);
      const posts: any[] = [];
      snap.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (posts.length > 0) {
        memoryStore.newsPosts = posts;
        return posts;
      }
    } catch (e) {
      handleFirestoreError(e, 'getNewsPosts');
    }
  }
  return memoryStore.newsPosts;
}

export async function saveNewsPosts(posts: any[]): Promise<void> {
  memoryStore.newsPosts = posts;
  saveMemoryToFile();
  const db = getDb();
  if (db) {
    try {
      for (const post of posts) {
        const docId = post.id || post.slug || `news-${Date.now()}`;
        await setDoc(doc(db, 'gadget_news', docId), post, { merge: true });
      }
    } catch (e) {
      handleFirestoreError(e, 'saveNewsPosts');
    }
  }
}

export async function deleteNewsPost(id: string): Promise<void> {
  memoryStore.newsPosts = memoryStore.newsPosts.filter((p) => p.id !== id && p.slug !== id);
  saveMemoryToFile();
  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'gadget_news', id));
    } catch (e) {
      handleFirestoreError(e, 'deleteNewsPost');
    }
  }
}

export async function getNewsletterSubscribers(): Promise<any[]> {
  const db = getDb();
  if (db) {
    try {
      const colRef = collection(db, 'newsletter_subscribers');
      const snap = await getDocs(colRef);
      const subs: any[] = [];
      snap.forEach((docSnap) => {
        subs.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (subs.length > 0) {
        memoryStore.newsletterSubscribers = subs;
        saveMemoryToFile();
        return subs;
      }
    } catch (e) {
      handleFirestoreError(e, 'getNewsletterSubscribers');
    }
  }
  return memoryStore.newsletterSubscribers;
}

export async function saveNewsletterSubscribers(subscribers: any[]): Promise<void> {
  memoryStore.newsletterSubscribers = subscribers;
  saveMemoryToFile();
  const db = getDb();
  if (db) {
    try {
      for (const sub of subscribers) {
        const docId = sub.id || `sub-${Date.now()}`;
        await setDoc(doc(db, 'newsletter_subscribers', docId), sub, { merge: true });
      }
    } catch (e) {
      handleFirestoreError(e, 'saveNewsletterSubscribers');
    }
  }
}

export async function getPriceAlerts(): Promise<any[]> {
  const db = getDb();
  if (db) {
    try {
      const colRef = collection(db, 'price_alerts');
      const snap = await getDocs(colRef);
      const alerts: any[] = [];
      snap.forEach((docSnap) => {
        alerts.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (alerts.length > 0) {
        memoryStore.priceAlerts = alerts;
        saveMemoryToFile();
        return alerts;
      }
    } catch (e) {
      handleFirestoreError(e, 'getPriceAlerts');
    }
  }
  return memoryStore.priceAlerts;
}

export async function savePriceAlerts(alerts: any[]): Promise<void> {
  memoryStore.priceAlerts = alerts;
  saveMemoryToFile();
  const db = getDb();
  if (db) {
    try {
      for (const alert of alerts) {
        const docId = alert.id || `alert-${Date.now()}`;
        await setDoc(doc(db, 'price_alerts', docId), alert, { merge: true });
      }
    } catch (e) {
      handleFirestoreError(e, 'savePriceAlerts');
    }
  }
}

export async function deletePriceAlert(id: string): Promise<void> {
  memoryStore.priceAlerts = memoryStore.priceAlerts.filter((a) => a.id !== id);
  saveMemoryToFile();
  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'price_alerts', id));
    } catch (e) {
      handleFirestoreError(e, 'deletePriceAlert');
    }
  }
}

export async function getCustomProducts(): Promise<any[]> {
  const db = getDb();
  if (db) {
    try {
      const colRef = collection(db, 'custom_products');
      const snap = await getDocs(colRef);
      const fsProducts: any[] = [];
      snap.forEach((docSnap) => {
        fsProducts.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (fsProducts.length > 0) {
        // Safely merge Firestore custom products with memoryStore without losing local additions
        const map = new Map<string, any>();
        memoryStore.customProducts.forEach((p) => map.set(p.id, p));
        fsProducts.forEach((p) => map.set(p.id, p));
        memoryStore.customProducts = Array.from(map.values());
        saveMemoryToFile();
      }
    } catch (e) {
      handleFirestoreError(e, 'getCustomProducts');
    }
  }
  return memoryStore.customProducts;
}

export async function saveCustomProduct(product: any): Promise<void> {
  const custom = await getCustomProducts();
  const index = custom.findIndex((p: any) => p.id === product.id);
  if (index > -1) {
    custom[index] = product;
  } else {
    custom.unshift(product);
  }
  memoryStore.customProducts = custom;
  saveMemoryToFile();

  const db = getDb();
  if (db) {
    try {
      await setDoc(doc(db, 'custom_products', product.id), product, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'saveCustomProduct');
    }
  }
}

export async function deleteCustomProduct(id: string): Promise<void> {
  const custom = await getCustomProducts();
  memoryStore.customProducts = custom.filter((p: any) => p.id !== id);
  saveMemoryToFile();
  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'custom_products', id));
    } catch (e) {
      handleFirestoreError(e, 'deleteCustomProduct');
    }
  }
}

export async function getDeletedProducts(): Promise<string[]> {
  const db = getDb();
  if (db) {
    try {
      const colRef = collection(db, 'deleted_products');
      const snap = await getDocs(colRef);
      const fsDeleted: string[] = [];
      snap.forEach((docSnap) => {
        fsDeleted.push(docSnap.id);
      });
      if (fsDeleted.length > 0) {
        const mergedSet = new Set([...memoryStore.deletedProducts, ...fsDeleted]);
        memoryStore.deletedProducts = Array.from(mergedSet);
        saveMemoryToFile();
      }
    } catch (e) {
      handleFirestoreError(e, 'getDeletedProducts');
    }
  }
  return memoryStore.deletedProducts;
}

export async function clearDeletedProducts(): Promise<void> {
  memoryStore.deletedProducts = [];
  saveMemoryToFile();
  const db = getDb();
  if (db) {
    try {
      const colRef = collection(db, 'deleted_products');
      const snap = await getDocs(colRef);
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'deleted_products', docSnap.id));
      }
    } catch (e) {
      handleFirestoreError(e, 'clearDeletedProducts');
    }
  }
}

export async function addDeletedProduct(id: string): Promise<void> {
  const deleted = await getDeletedProducts();
  if (!deleted.includes(id)) {
    deleted.push(id);
  }
  memoryStore.deletedProducts = deleted;
  saveMemoryToFile();

  const db = getDb();
  if (db) {
    try {
      await setDoc(doc(db, 'deleted_products', id), { deletedAt: new Date().toISOString() });
    } catch (e) {
      handleFirestoreError(e, 'addDeletedProduct');
    }
  }
}

export async function removeDeletedProduct(id: string): Promise<void> {
  const deleted = await getDeletedProducts();
  memoryStore.deletedProducts = deleted.filter((d) => d !== id);
  saveMemoryToFile();

  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'deleted_products', id));
    } catch (e) {
      handleFirestoreError(e, 'removeDeletedProduct');
    }
  }
}
