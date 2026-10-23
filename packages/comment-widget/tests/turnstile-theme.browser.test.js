import { assert, test, vi } from 'vitest';

test('Turnstile theme regression', async () => {
  await import('../src/turnstile-captcha.ts');

  const renders = [];
  const removed = [];
  vi.stubGlobal('turnstile', {
    render(_container, options) {
      renders.push(options);
      return String(renders.length);
    },
    remove(id) {
      removed.push(id);
    },
    reset() {},
  });
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  const captcha = document.createElement('turnstile-captcha');
  captcha.siteKey = 'test';
  root.append(captcha);
  document.body.append(host);

  const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
  const expectTheme = async (theme) => {
    await settle();
    assert(renders.at(-1).theme === theme, `Expected ${theme}`);
  };

  await expectTheme('light');
  renders.at(-1).callback('old-token');
  document.documentElement.classList.add('dark');
  await expectTheme('dark');
  assert(captcha.token === '', 'Theme changes must clear the old token');
  assert(removed.length > 0, 'Theme changes must remove the old widget');
  const count = renders.length;
  document.documentElement.classList.add('unrelated');
  await settle();
  assert(renders.length === count, 'Unchanged themes must not remount');
  document.documentElement.className = '';
  await expectTheme('light');
  document.body.dataset.colorScheme = 'dark';
  await expectTheme('dark');
  host.style.colorScheme = 'light';
  await expectTheme('light');
  host.style.colorScheme = '';
  document.body.dataset.colorScheme = 'auto';
  await expectTheme(
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  host.remove();
  const disconnectedCount = renders.length;
  document.body.dataset.colorScheme = 'dark';
  await settle();
  assert(
    renders.length === disconnectedCount,
    'Disconnected widgets must not render'
  );
  document.body.append(host);
  await expectTheme('dark');
  document.body.dataset.colorScheme = 'auto';
  await settle();
});
