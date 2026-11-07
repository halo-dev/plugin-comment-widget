import { assert, test } from 'vitest';
import { until } from './browser-helpers.js';

test('Emoji picker uses Traditional Chinese for zh-TW', async () => {
  // biome-ignore lint/suspicious/noDocumentCookie: Exercise the widget's existing locale cookie contract.
  document.cookie = 'language=zh-TW; path=/';

  await import('../src/emoji-button.ts');
  const emoji = document.createElement('emoji-button');
  document.body.append(emoji);

  await emoji.handleOpenEmojiPicker(new MouseEvent('click'));
  await until(() =>
    document
      .querySelector('em-emoji-picker')
      ?.shadowRoot?.querySelector('input')
  );

  const picker = document.querySelector('em-emoji-picker');
  assert(
    picker.shadowRoot.querySelector('input').placeholder === '搜尋',
    'Search placeholder must be Traditional Chinese'
  );

  const categoryLabels = [
    ...picker.shadowRoot.querySelectorAll('button[aria-label]'),
  ].map((button) => button.getAttribute('aria-label'));
  assert(
    categoryLabels.includes('表情與角色') &&
      !categoryLabels.includes('表情与角色'),
    'Category labels must be Traditional Chinese'
  );
});
