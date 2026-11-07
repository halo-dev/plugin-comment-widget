import { assert, test } from 'vitest';

test('Emoji panel must not appear when navigation interrupts its first load', async () => {
  document.body.innerHTML = '<main><div id="fixtures"></div></main>';
  await import('../src/index.ts');
  const fixtures = document.querySelector('#fixtures');
  const button = document.createElement('emoji-button');
  fixtures.append(button);
  await button.updateComplete;

  // This is the first open in this file, so the picker is loaded lazily.
  const opening = button.handleOpenEmojiPicker(new MouseEvent('click'));
  button.remove();
  fixtures.replaceChildren();
  await opening;

  const wrapper = document.querySelector('.form__emoji-panel');
  assert(wrapper, 'The shared panel must exist');
  assert(
    getComputedStyle(wrapper).display === 'none',
    'A page change during loading must not show the panel'
  );
  assert(
    !wrapper.querySelector('em-emoji-picker'),
    'An interrupted first load must not create a picker'
  );
});
