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

  async function open(key) {
    const image = content.shadowRoot.querySelector('img');
    await image.decode();
    const opened = new Promise((resolve) =>
      image.addEventListener('medium-zoom:opened', resolve, { once: true })
    );
    if (key) {
      image.focus();
      image.dispatchEvent(
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
  await open('Enter');
  document.querySelector('.medium-zoom-overlay').click();
  await closed();

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
