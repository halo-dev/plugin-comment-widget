import { afterEach, vi } from 'vitest';
import '../var.css';

afterEach(async () => {
  const url = new URL(location.href);
  if (url.searchParams.has('comment-page')) {
    url.searchParams.delete('comment-page');
    history.replaceState(history.state, '', url);
  }
  document.body.replaceChildren();
  document.documentElement.className = '';
  document.documentElement.lang = 'en';
  delete document.body.dataset.colorScheme;
  localStorage.clear();
  // Test files that share a browser session share IndexedDB too, so leaked
  // upload tickets would otherwise break the draft recovery of later files.
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('halo-comment-uploads');
    request.onsuccess = request.onerror = () => resolve();
  });
  // biome-ignore lint/suspicious/noDocumentCookie: Restore the locale cookie used by the widget.
  document.cookie = 'language=; max-age=0; path=/';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
