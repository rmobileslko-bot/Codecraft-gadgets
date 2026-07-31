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

let isFirestoreDisabled = false;

function handleFirestoreError(e: any, operationName: string) {
  const msg = String(e?.message || e);
  if (msg.includes('PERMISSION_DENIED') || msg.includes('disabled') || msg.includes('not been used')) {
    console.info(`Cloud Firestore API is not enabled for this project. Disabling server-side Firestore and falling back to memory store.`);
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

    if (!config || !config.projectId) {
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
      const products: any[] = [];
      snap.forEach((docSnap) => {
        products.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (products.length > 0) {
        memoryStore.customProducts = products;
        return products;
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
    custom.push(product);
  }
  memoryStore.customProducts = custom;

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
      const deleted: string[] = [];
      snap.forEach((docSnap) => {
        deleted.push(docSnap.id);
      });
      if (deleted.length > 0) {
        memoryStore.deletedProducts = deleted;
        return deleted;
      }
    } catch (e) {
      handleFirestoreError(e, 'getDeletedProducts');
    }
  }
  return memoryStore.deletedProducts;
}

export async function addDeletedProduct(id: string): Promise<void> {
  const deleted = await getDeletedProducts();
  if (!deleted.includes(id)) {
    deleted.push(id);
  }
  memoryStore.deletedProducts = deleted;

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

  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'deleted_products', id));
    } catch (e) {
      handleFirestoreError(e, 'removeDeletedProduct');
    }
  }
}
