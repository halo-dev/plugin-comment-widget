import { afterEach, vi } from 'vitest';
import '../var.css';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.className = '';
  document.documentElement.lang = 'en';
  delete document.body.dataset.colorScheme;
  localStorage.clear();
  // biome-ignore lint/suspicious/noDocumentCookie: Restore the locale cookie used by the widget.
  document.cookie = 'language=; max-age=0; path=/';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
