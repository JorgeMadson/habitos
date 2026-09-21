import {onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut} from 'firebase/auth';
import {collection, doc, onSnapshot, setDoc, updateDoc, runTransaction, query, where} from 'firebase/firestore';
import {auth, db} from '../firebase.js';
import {validateEntries} from './model.js';

export const state = {user: null, loading: true, entries: [], fromCache: true, pending: false, error: '', failed: []};
const listeners = new Set();
const localWaiters = new Set();
let unsubscribe;
let operations = 0;
let snapshotPending = false;
function emit() { for (const fn of listeners) fn(state); }
export function subscribe(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }
export function errorMessage(error) {
  return ({
    'auth/invalid-credential': 'Confira seu e-mail e senha.',
    'auth/user-not-found': 'Confira seu e-mail e senha.',
    'auth/wrong-password': 'Confira seu e-mail e senha.',
    'auth/email-already-in-use': 'Este e-mail já tem uma conta. Entre ou recupere sua senha.',
    'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/network-request-failed': 'Conecte-se à internet para entrar, criar uma conta ou recuperar a senha.',
    'auth/operation-not-allowed': 'Ative E-mail/senha no Firebase Authentication.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',
    'permission-denied': 'O Firebase recusou o acesso. Confira as regras do Firestore e a conta conectada.',
    'unavailable': 'O servidor está indisponível. Seus registros locais continuam disponíveis.',
  })[error.code] || error.message || 'Não foi possível concluir. Tente novamente.';
}
const recoveryKey = uid => `entre.failed.${uid}`;
function readFailed(uid) {
  try { const value = JSON.parse(localStorage.getItem(recoveryKey(uid)) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function keepFailed(uid, entry, kind, changedFields=[]) {
  const current = readFailed(uid);
  const previous = current.find(item => item.entry.id === entry.id);
  const items = current.filter(item => item.entry.id !== entry.id);
  // A rejected create must remain a create even if later local enrichment also fails.
  items.push({entry, kind: previous?.kind === 'create' ? 'create' : kind, changedFields});
  try { localStorage.setItem(recoveryKey(uid), JSON.stringify(items)); }
  catch { if (state.user?.uid === uid) state.error += ' Exporte um backup agora: não foi possível guardar a cópia de recuperação.'; }
  if (state.user?.uid === uid) state.failed = items;
}
function clearFailed(uid, id) {
  const remaining = readFailed(uid).filter(item => item.entry.id !== id);
  try { localStorage.setItem(recoveryKey(uid), JSON.stringify(remaining)); } catch { /* Existing recovery copy remains exportable. */ }
  if (state.user?.uid === uid) state.failed = remaining;
}
onAuthStateChanged(auth, user => {
  unsubscribe?.();
  for (const cancel of [...localWaiters]) cancel();
  operations = 0;
  snapshotPending = false;
  Object.assign(state, {user, loading: Boolean(user), entries: [], fromCache: true, pending: false, error: '', failed: user ? readFailed(user.uid) : []});
  emit();
  if (!user) return;
  watchEntries(user.uid);
}, error => { state.loading = false; state.error = errorMessage(error); emit(); });

function watchEntries(uid) {
  unsubscribe?.();
  const radarEntries = query(collection(db, 'users', uid, 'entries'), where('schemaVersion', '==', 2));
  unsubscribe = onSnapshot(radarEntries, {includeMetadataChanges: true}, snapshot => {
    if (state.user?.uid !== uid) return;
    try {
      const records = snapshot.docs.filter(d => !d.data().deleted).map(d => {
        const {deleted, ...entry} = d.data();
        if (entry.id !== d.id) throw new Error('Um registro recebido tem identificação inválida.');
        return entry;
      });
      validateEntries(records);
      state.entries = records.sort((a,b) => Date.parse(a.at)-Date.parse(b.at) || a.id.localeCompare(b.id));
      state.loading = false;
      state.fromCache = snapshot.metadata.fromCache;
      snapshotPending = snapshot.metadata.hasPendingWrites;
      state.pending = snapshotPending || operations > 0;
      // Permission failures stay visible until the user retries or reconnects.
      emit();
    } catch (error) { state.error = errorMessage(error); state.loading = false; emit(); }
  }, error => { if (state.user?.uid === uid) {state.error = errorMessage(error); state.loading = false; emit();} });
}

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const resetPassword = email => sendPasswordResetEmail(auth, email);
export async function logout() {
  if (state.pending || operations) throw new Error('Aguarde a sincronização dos registros antes de sair.');
  await signOut(auth);
}

// Resolve on the local Firestore snapshot, not on the server promise (which waits offline).
// The SDK owns the durable queue and retries. Rejected writes get a separate recovery copy.
export function saveEntry(entry, kind = 'create', changedFields = []) {
  validateEntries([entry]);
  if (!state.user || state.loading) return Promise.reject(new Error('Entre na sua conta e aguarde o carregamento.'));
  const uid = state.user.uid;
  const ref = doc(db, 'users', uid, 'entries', entry.id);
  const radarFields = ['energy','emotion','context','alone','nextActionDefined','avoidedTask','cycleLevel','trigger','intervention','interventionResult','apathyScore','fatigueScore','sadnessScore','anxietyScore','guiltScore','focusDifficultyScore','recoveryMinutes','aftermathRecorded'];
  const data = kind === 'delete' ? {deleted: true} : kind === 'radar'
    ? Object.fromEntries((changedFields.length ? changedFields : radarFields).map(key => [key, entry[key]]))
    : {...entry, deleted: false};
  operations++;
  state.pending = true;
  emit();
  return new Promise((resolve, reject) => {
    let stop = () => {};
    let settled = false;
    function finish(error) {
      if (settled) return;
      settled = true; stop(); localWaiters.delete(cancel);
      if (error) reject(error); else resolve();
    }
    const cancel = () => finish(new Error('A conta mudou. Confira os registros antes de continuar.'));
    localWaiters.add(cancel);
    stop = onSnapshot(ref, {includeMetadataChanges: true}, snapshot => {
      const current = snapshot.data();
      if (current && Object.entries(data).every(([key, value]) => JSON.stringify(current[key]) === JSON.stringify(value))) finish();
    }, finish);
    const request = kind === 'create' ? setDoc(ref, data) : updateDoc(ref, data);
    request.then(() => {
      clearFailed(uid, entry.id);
      if (state.user?.uid === uid) { operations = Math.max(0, operations-1); state.pending = snapshotPending || operations > 0; emit(); }
      finish();
    }).catch(error => {
      if (state.user?.uid === uid) {operations = Math.max(0, operations-1); state.pending = snapshotPending || operations > 0; state.error = errorMessage(error);}
      keepFailed(uid, entry, kind, changedFields);
      if (state.user?.uid === uid) emit();
      finish(error);
    });
  });
}
export async function retryFailed() {
  state.error = '';
  if (state.user) watchEntries(state.user.uid);
  emit();
  for (const {entry, kind, changedFields} of [...state.failed]) await saveEntry(entry, kind, changedFields);
}
export function exportEntries() {
  const combined = new Map(state.entries.map(e => [e.id, e]));
  for (const {entry, kind} of state.failed) if (kind !== 'delete') combined.set(entry.id, entry);
  return [...combined.values()];
}
// Online transaction keeps V2 imports idempotent across devices and never resurrects tombstones.
export async function importEntries(records) {
  validateEntries(records);
  if (!state.user) throw new Error('Entre antes de importar.');
  if (!navigator.onLine) throw new Error('Conecte-se à internet para importar sem duplicar registros.');
  const uid = state.user.uid;
  let imported = 0;
  for (const entry of records) {
    if (state.user?.uid !== uid) throw new Error('A conta mudou durante a importação.');
    const ref = doc(db, 'users', uid, 'entries', entry.id);
    const added = await runTransaction(db, async transaction => {
      if ((await transaction.get(ref)).exists()) return false;
      transaction.set(ref, {...entry, deleted: false});
      return true;
    });
    if (added) imported++;
  }
  return imported;
}
