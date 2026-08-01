import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, disableNetwork, terminate, collection, doc, setDoc, getDocs, deleteDoc, query, getDoc } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const saved = localStorage.getItem('firebase_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading firebase_config from localStorage:', e);
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  isFirestoreDisabled = false;
  try {
    localStorage.removeItem('firestore_disabled');
  } catch (_) {}
  localStorage.setItem('firebase_config', JSON.stringify(config));
}

export function clearFirebaseConfig() {
  isFirestoreDisabled = true;
  try {
    localStorage.setItem('firestore_disabled', 'true');
  } catch (_) {}
  if (firebaseDb) {
    const dbToDisable = firebaseDb;
    firebaseDb = null;
    try {
      disableNetwork(dbToDisable).catch(() => {});
      terminate(dbToDisable).catch(() => {});
    } catch (_) {}
  }
  localStorage.removeItem('firebase_config');
}

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;
let isFirestoreDisabled = false;

function checkIsFirestoreDisabled(): boolean {
  if (isFirestoreDisabled) return true;
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('firestore_disabled') === 'true') {
      isFirestoreDisabled = true;
      return true;
    }
  } catch (_) {}
  return false;
}

function handleClientFirestoreError(e: any, operationName: string) {
  const msg = String(e?.message || e);
  if (
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('permission') ||
    msg.includes('disabled') ||
    msg.includes('not been used') ||
    msg.includes('NOT_FOUND')
  ) {
    console.info(`Cloud Firestore access issue for '${operationName}'. Using local storage fallback.`);
    try {
      localStorage.setItem('firestore_disabled', 'true');
    } catch (_) {}
  } else {
    console.warn(`Client Firestore operation '${operationName}' skipped:`, msg);
  }
  isFirestoreDisabled = true;
  if (firebaseDb) {
    const dbToDisable = firebaseDb;
    firebaseDb = null;
    try {
      disableNetwork(dbToDisable).catch(() => {});
      terminate(dbToDisable).catch(() => {});
    } catch (_) {}
  }
}

// Intercept background Firestore gRPC connection errors (e.g. disabled Cloud Firestore API)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason?.stack || event.reason || '');
    if (
      reasonStr.includes('PERMISSION_DENIED') || 
      reasonStr.includes('Cloud Firestore API has not been used') || 
      reasonStr.includes('firestore.googleapis.com') ||
      reasonStr.includes('is disabled')
    ) {
      try {
        event.preventDefault();
      } catch (_) {}
      isFirestoreDisabled = true;
      try {
        localStorage.setItem('firestore_disabled', 'true');
      } catch (_) {}
      if (firebaseDb) {
        const dbToDisable = firebaseDb;
        firebaseDb = null;
        try {
          disableNetwork(dbToDisable).catch(() => {});
          terminate(dbToDisable).catch(() => {});
        } catch (_) {}
      }
    }
  });
}

export function initFirebase() {
  const config = getSavedFirebaseConfig();
  if (!config) {
    return { app: null, auth: null, db: null };
  }

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(config);
    }
    firebaseAuth = getAuth(firebaseApp);
    if (!checkIsFirestoreDisabled()) {
      try {
        firebaseDb = getFirestore(firebaseApp);
      } catch (err) {
        handleClientFirestoreError(err, 'initFirestore');
      }
    }
    return { app: firebaseApp, auth: firebaseAuth, db: isFirestoreDisabled ? null : firebaseDb };
  } catch (error) {
    console.warn('Failed to initialize Firebase:', error);
    return { app: null, auth: null, db: null };
  }
}

export function getFirebaseInstances() {
  if (!firebaseApp) {
    return initFirebase();
  }
  if (checkIsFirestoreDisabled()) {
    if (firebaseDb) {
      const dbToDisable = firebaseDb;
      firebaseDb = null;
      try {
        disableNetwork(dbToDisable).catch(() => {});
      } catch (_) {}
    }
    return { app: firebaseApp, auth: firebaseAuth, db: null };
  }
  return { app: firebaseApp, auth: firebaseAuth, db: isFirestoreDisabled ? null : firebaseDb };
}

// Authentication Helpers
export async function signInWithGoogle() {
  const { auth } = getFirebaseInstances();
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logOut() {
  const { auth } = getFirebaseInstances();
  if (!auth) throw new Error('Firebase Auth is not initialized');
  await signOut(auth);
}

// Firestore helpers for persistence
export async function syncProductToFirestore(product: any) {
  const { db } = getFirebaseInstances();
  if (!db || isFirestoreDisabled) return; // Silent skip if Firebase is not configured or disabled
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (e) {
    handleClientFirestoreError(e, 'syncProductToFirestore');
  }
}

export async function deleteProductFromFirestore(productId: string) {
  const { db } = getFirebaseInstances();
  if (!db || isFirestoreDisabled) return;
  try {
    await deleteDoc(doc(db, 'products', productId));
    // Also track soft-deleted products
    await setDoc(doc(db, 'deleted_products', productId), { deletedAt: new Date().toISOString() });
  } catch (e) {
    handleClientFirestoreError(e, 'deleteProductFromFirestore');
  }
}

export async function fetchProductsFromFirestore(): Promise<any[]> {
  const { db } = getFirebaseInstances();
  if (!db || isFirestoreDisabled) return [];
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products: any[] = [];
    querySnapshot.forEach((doc) => {
      products.push(doc.data());
    });
    return products;
  } catch (e) {
    handleClientFirestoreError(e, 'fetchProductsFromFirestore');
    return [];
  }
}

export async function fetchDeletedProductsFromFirestore(): Promise<string[]> {
  const { db } = getFirebaseInstances();
  if (!db || isFirestoreDisabled) return [];
  try {
    const querySnapshot = await getDocs(collection(db, 'deleted_products'));
    const ids: string[] = [];
    querySnapshot.forEach((doc) => {
      ids.push(doc.id);
    });
    return ids;
  } catch (e) {
    handleClientFirestoreError(e, 'fetchDeletedProductsFromFirestore');
    return [];
  }
}

export async function savePriceAlertToFirestore(alert: any) {
  const { db } = getFirebaseInstances();
  if (!db || isFirestoreDisabled) return;
  try {
    await setDoc(doc(db, 'price_alerts', alert.id), alert);
  } catch (e) {
    handleClientFirestoreError(e, 'savePriceAlertToFirestore');
  }
}

export async function saveNewsletterSubscriptionToFirestore(subscription: any) {
  const { db } = getFirebaseInstances();
  if (!db || isFirestoreDisabled) return;
  try {
    await setDoc(doc(db, 'newsletter_subscriptions', subscription.id), subscription);
  } catch (e) {
    handleClientFirestoreError(e, 'saveNewsletterSubscriptionToFirestore');
  }
}

