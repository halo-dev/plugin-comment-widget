import { vi } from 'vitest';

export function until(predicate) {
  return vi.waitFor(
    () => {
      if (!predicate()) throw new Error('Timed out waiting for UI');
    },
    { timeout: 4000, interval: 20 }
  );
}

export function mockApi(handler) {
  const fetch = window.fetch.bind(window);
  vi.spyOn(window, 'fetch').mockImplementation((input, options) => {
    const url = new URL(String(input), location.href);
    return url.pathname.startsWith('/apis/') ||
      url.pathname === '/actuator/globalinfo'
      ? handler(input, options)
      : fetch(input, options);
  });
}
