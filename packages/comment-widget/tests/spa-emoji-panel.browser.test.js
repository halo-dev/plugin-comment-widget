import { assert, test } from 'vitest';
import { until } from './browser-helpers.js';

function emojiPanelStyle() {
  return [...document.head.querySelectorAll('style')].find((style) =>
    style.textContent?.includes('.form__emoji-panel')
  );
}

function emojiPanelWrapper() {
  return document.body.querySelector('.form__emoji-panel');
}

test('Emoji panel stays hidden after an SPA page change', async () => {
  document.body.innerHTML = '<main><div id="fixtures"></div></main>';
  await import('../src/index.ts');
  const fixtures = document.querySelector('#fixtures');
  const button = document.createElement('emoji-button');
  fixtures.append(button);
  await button.updateComplete;

  await button.handleOpenEmojiPicker(new MouseEvent('click'));
  await until(() => emojiPanelWrapper()?.querySelector('em-emoji-picker'));
  const wrapper = emojiPanelWrapper();
  assert(
    getComputedStyle(wrapper).display === 'block',
    'The panel must be visible while open'
  );

  button.closeEmojiPicker();
  assert(
    getComputedStyle(wrapper).display === 'none',
    'The panel must be hidden once closed'
  );

  // SwupHeadPlugin removes runtime-injected head tags that are not part of the
  // incoming document before replacing the page content.
  emojiPanelStyle()?.remove();
  assert(
    getComputedStyle(wrapper).display === 'none',
    'The closed panel must stay hidden without the injected styles'
  );

  // The old page is replaced and the next page has no comment widget.
  fixtures.replaceChildren();
  assert(
    getComputedStyle(wrapper).display === 'none',
    'The panel must stay hidden when no button reconnects'
  );

  // The next page has a comment widget, whose new button restores the styles.
  const nextButton = document.createElement('emoji-button');
  fixtures.append(nextButton);
  await nextButton.updateComplete;
  assert(
    emojiPanelStyle(),
    'The panel styles must be restored after a page change'
  );
  assert(
    wrapper.isConnected && getComputedStyle(wrapper).display === 'none',
    'The shared panel must stay attached and hidden'
  );

  // Navigating away while the panel is open must also close it.
  await nextButton.handleOpenEmojiPicker(new MouseEvent('click'));
  assert(
    getComputedStyle(wrapper).display === 'block',
    'The panel must reopen on the new page'
  );
  fixtures.replaceChildren();
  const openedDuringNavigationButton = document.createElement('emoji-button');
  fixtures.append(openedDuringNavigationButton);
  await openedDuringNavigationButton.updateComplete;
  assert(
    getComputedStyle(wrapper).display === 'none',
    'Navigating away must close an open panel'
  );

  // Some hosts replace the whole body instead of a single container.
  const detachedPicker = wrapper.querySelector('em-emoji-picker');
  document.body.replaceChildren();
  const bodyReplacedButton = document.createElement('emoji-button');
  document.body.append(bodyReplacedButton);
  await bodyReplacedButton.updateComplete;
  assert(
    wrapper.isConnected && getComputedStyle(wrapper).display === 'none',
    'The shared panel must be reattached when the body is replaced'
  );

  await bodyReplacedButton.handleOpenEmojiPicker(new MouseEvent('click'));
  assert(
    getComputedStyle(wrapper).display === 'block',
    'The panel must open after recovering from a page change'
  );
  const picker = wrapper.querySelector('em-emoji-picker');
  assert(
    picker && picker !== detachedPicker,
    'A picker detached from the document must be replaced'
  );
  bodyReplacedButton.closeEmojiPicker();
  assert(
    getComputedStyle(wrapper).display === 'none',
    'The recovered panel must still close'
  );

  // Losing the styles while the button stays connected must be repaired on the
  // next open, not only when a button reconnects.
  emojiPanelStyle()?.remove();
  await bodyReplacedButton.handleOpenEmojiPicker(new MouseEvent('click'));
  assert(emojiPanelStyle(), 'Opening the panel must restore missing styles');
  assert(
    getComputedStyle(wrapper).display === 'block',
    'The panel must open after its styles are restored'
  );
  bodyReplacedButton.closeEmojiPicker();
});

test('Reattaching the same button resets its expanded state', async () => {
  document.body.innerHTML = '<main><div id="fixtures"></div></main>';
  await import('../src/index.ts');
  const fixtures = document.querySelector('#fixtures');
  const button = document.createElement('emoji-button');
  fixtures.append(button);
  await button.updateComplete;

  await button.handleOpenEmojiPicker(new MouseEvent('click'));
  const trigger = button.shadowRoot.querySelector('button');
  await button.updateComplete;
  assert(
    trigger.getAttribute('aria-expanded') === 'true',
    'The open panel must mark the button as expanded'
  );

  button.remove();
  fixtures.append(button);
  await button.updateComplete;
  assert(
    trigger.getAttribute('aria-expanded') === 'false',
    'Reattaching a button must reset its expanded state'
  );

  await button.handleOpenEmojiPicker(new MouseEvent('click'));
  await button.updateComplete;
  assert(
    trigger.getAttribute('aria-expanded') === 'true' &&
      getComputedStyle(emojiPanelWrapper()).display === 'block',
    'The reattached button must open the panel on the first click'
  );
  button.closeEmojiPicker();
});
