import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Public Web configuration. Access is enforced by Authentication and Firestore rules.
const emulated = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
export const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCg35ofa-1ztUb76U81mjUGN_GjnuWpJHM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'entre-habitos.firebaseapp.com',
  projectId: emulated ? 'demo-entre' : (import.meta.env.VITE_FIREBASE_PROJECT_ID || 'entre-habitos'),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:139875196538:web:14041bda49ef908a1225c3',
});
export const auth = getAuth(firebaseApp);
auth.languageCode = 'pt-BR';
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager(), cacheSizeBytes: CACHE_SIZE_UNLIMITED}),
});
if (emulated) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings: true});
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
