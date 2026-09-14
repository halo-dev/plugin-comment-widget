import { expect, test } from 'vitest';
import '../src/comment-content.ts';
import imageUrl from '../src/assets/halo.png';
import { until } from './browser-helpers.js';

test('comment images zoom in shadow DOM and clean up on content changes and removal', async () => {
  const content = document.createElement('comment-content');
  const markup = `<a href="https://example.com"><img src="${imageUrl}" width="12" alt="Halo"></a>`;
  content.content = markup;
  document.body.append(content);
  await content.updateComplete;

  const trigger = content.shadowRoot.querySelector('img');
  expect(trigger.getAttribute('role')).toBe('button');
  expect(content.shadowRoot.querySelector('a')).toBeNull();

  async function open(key) {
    const image = content.shadowRoot.querySelector('img');
    await image.decode();
    const opened = new Promise((resolve) =>
      image.addEventListener('medium-zoom:opened', resolve, { once: true })
    );
    if (key) {
      const control = image.closest('a') || image;
      control.focus();
      control.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      );
    } else {
      image.click();
    }
    await opened;
    const zoomed = document.querySelector('.medium-zoom-image--opened');
    expect(zoomed.getBoundingClientRect().width).toBeGreaterThan(image.width);
    expect(getComputedStyle(image).visibility).toBe('hidden');
    expect(getComputedStyle(zoomed).zIndex).toBe('2147483647');
    await until(() => document.activeElement === zoomed);
    return image;
  }

  async function closed() {
    await until(() => !document.querySelector('.medium-zoom-overlay'));
    expect(document.querySelector('.medium-zoom-image--opened')).toBeNull();
    expect(document.body.classList.contains('medium-zoom--opened')).toBe(false);
  }

  const image = await open();
  document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
  await closed();
  expect(getComputedStyle(image).visibility).toBe('visible');
  expect(content.shadowRoot.activeElement).toBe(trigger);
  for (const key of ['Enter', ' ']) {
    await open('Enter');
    document.activeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    );
    await closed();
    expect(content.shadowRoot.activeElement).toBe(trigger);
  }

  await open(' ');
  content.content = '<p>Updated</p>';
  await content.updateComplete;
  await closed();

  content.content = markup;
  await content.updateComplete;
  const replacement = content.shadowRoot.querySelector('img');
  await replacement.decode();
  replacement.click();
  content.remove();
  await closed();

  document.body.append(content);
  await open();
  content.remove();
  await closed();
});

test('image controls use the active locale', async () => {
  const { configureLocalization } = await import('@lit/localize');
  const { setLocale } = configureLocalization({
    sourceLocale: 'en',
    targetLocales: ['zh-CN', 'zh-TW', 'es'],
    loadLocale: (locale) => import(`../src/generated/locales/${locale}.ts`),
  });
  for (const [locale, openLabel, closeLabel] of [
    ['zh-CN', '放大图片', '关闭图片'],
    ['zh-TW', '放大圖片', '關閉圖片'],
    ['es', 'Ampliar imagen', 'Cerrar imagen'],
  ]) {
    await setLocale(locale);
    const content = document.createElement('comment-content');
    content.content = `<img src="${imageUrl}" width="12">`;
    document.body.append(content);
    await content.updateComplete;
    const image = content.shadowRoot.querySelector('img');
    expect(image.getAttribute('aria-label')).toBe(openLabel);
    await image.decode();
    image.click();
    await until(() =>
      document.activeElement.classList.contains('medium-zoom-image--opened')
    );
    expect(document.activeElement.getAttribute('aria-label')).toBe(closeLabel);
    document.activeElement.click();
    await until(() => !document.querySelector('.medium-zoom-overlay'));
    expect(content.shadowRoot.activeElement).toBe(image);
    content.remove();
  }
  await setLocale('en');
});

test('mixed links keep navigation and each linked image has its own zoom control', async () => {
  const content = document.createElement('comment-content');
  content.content = `<a href="https://example.com"><strong>Before<img src="${imageUrl}" width="12" alt="A">Between<img src="${imageUrl}" width="12" alt="B">After</strong></a>`;
  document.body.append(content);
  await content.updateComplete;
  const images = [...content.shadowRoot.querySelectorAll('img')];
  expect(images.every((image) => !image.closest('a'))).toBe(true);
  const links = [...content.shadowRoot.querySelectorAll('a')];
  expect(links.map((link) => link.textContent).join('')).toBe(
    'BeforeBetweenAfter'
  );
  for (const link of links) {
    expect(link.getAttribute('href')).toBe('https://example.com');
    let navigationAllowed;
    content.shadowRoot.querySelector('.content').addEventListener(
      'click',
      (event) => {
        navigationAllowed = !event.defaultPrevented;
        event.preventDefault();
      },
      { once: true }
    );
    link.click();
    expect(navigationAllowed).toBe(true);
  }
  for (const image of images) {
    await image.decode();
    image.focus();
    image.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
    );
    await until(() =>
      document.activeElement.classList.contains('medium-zoom-image--opened')
    );
    const actualAlt = document.activeElement.alt;
    document.activeElement.click();
    await until(() => !document.querySelector('.medium-zoom-overlay'));
    expect(actualAlt).toBe(image.alt);
    expect(content.shadowRoot.activeElement).toBe(image);
  }
});

test('srcset zoom gives only the topmost clone a labelled keyboard control', async () => {
  const content = document.createElement('comment-content');
  content.content = `<img src="${imageUrl}" srcset="${imageUrl} 2x" width="6" alt="Original">`;
  document.body.append(content);
  await content.updateComplete;
  const image = content.shadowRoot.querySelector('img');
  await image.decode();
  for (const key of ['Enter', ' ']) {
    const opened = new Promise((resolve) =>
      image.addEventListener('medium-zoom:opened', resolve, { once: true })
    );
    image.click();
    await opened;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const clones = [
      ...document.querySelectorAll('body > .medium-zoom-image--opened'),
    ];
    const hd = clones.at(-1);
    const state = {
      count: clones.length,
      focus: document.activeElement === hd,
      label: hd.getAttribute('aria-label'),
      stops: clones.filter((clone) => clone.tabIndex === 0).length,
    };
    hd.focus();
    hd.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    );
    // Always clean up, including on the pre-fix failure path.
    if (!state.focus || state.label !== 'Close image' || state.stops !== 1) {
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
    }
    await until(() => !document.querySelector('.medium-zoom-overlay'));
    expect(state).toEqual({
      count: 2,
      focus: true,
      label: 'Close image',
      stops: 1,
    });
    expect(content.shadowRoot.activeElement).toBe(image);
  }
});
