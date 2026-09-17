import type { JSONContent } from '@tiptap/core';
import type { UploadSessionSnapshot } from './upload-session';

export interface UploadDraft {
  revision: string;
  document?: JSONContent;
  session: UploadSessionSnapshot;
}

let database: Promise<IDBDatabase> | undefined;

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('halo-comment-uploads', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        database = undefined;
      };
      resolve(db);
    };
  }).catch((error) => {
    database = undefined;
    throw error;
  });
  return database;
}

async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', mode);
    const request = action(tx.objectStore('drafts'));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function readUploadDraft(key: string, revision: string) {
  if (!key) return;
  const draft: UploadDraft | undefined = await transaction(
    'readonly',
    (store) => store.get(key)
  );
  if (draft?.revision === revision) return draft;
  // A document save may fail after localStorage advances; never discard its ticket.
  return draft?.session.pending ? { ...draft, document: undefined } : undefined;
}

export async function writeUploadDraft(
  key: string,
  revision: string,
  draft: UploadDraft,
  keep: boolean,
  sessionChange?: { previousPendingId?: string }
) {
  let saved = false;
  await transaction('readwrite', (store) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const current = JSON.parse(localStorage.getItem(key) || 'null');
      if (current?.revision !== revision) return;
      const stored: UploadDraft | undefined = request.result;
      const pending = stored?.session.pending;
      if (sessionChange) {
        // Only the holder of the current ticket can replace or clear it.
        if (pending && pending.id !== sessionChange.previousPendingId) return;
      } else if (pending) {
        draft.session.pending = pending;
      }
      saved = true;
      if (keep || draft.session.pending) store.put(draft, key);
      else store.delete(key);
    };
    return request;
  });
  return saved;
}

export async function deleteUploadDraft(
  key: string,
  revision: string,
  preservePending = false
) {
  if (!key || !revision) return;
  await transaction('readwrite', (store) => {
    const request = store.get(key);
    request.onsuccess = () => {
      if (
        request.result?.revision === revision &&
        (!preservePending || !request.result.session.pending)
      )
        store.delete(key);
    };
    return request;
  });
}
