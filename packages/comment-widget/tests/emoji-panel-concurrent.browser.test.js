import { assert, test } from 'vitest';

test('Two buttons opening the picker for the first time share one picker', async () => {
  document.body.innerHTML = '<main><div id="fixtures"></div></main>';
  await import('../src/index.ts');
  const fixtures = document.querySelector('#fixtures');
  const first = document.createElement('emoji-button');
  const second = document.createElement('emoji-button');
  fixtures.append(first, second);
  await Promise.all([first.updateComplete, second.updateComplete]);

  // The picker is loaded lazily, so both buttons still take the async path.
  const firstOpening = first.handleOpenEmojiPicker(new MouseEvent('click'));
  const secondOpening = second.handleOpenEmojiPicker(new MouseEvent('click'));
  await Promise.all([firstOpening, secondOpening]);
  await Promise.all([first.updateComplete, second.updateComplete]);

  const wrapper = document.querySelector('.form__emoji-panel');
  assert(
    wrapper.querySelectorAll('em-emoji-picker').length === 1,
    'Concurrent openings must create a single picker'
  );
  assert(
    !first.emojiPickerVisible &&
      second.emojiPickerVisible &&
      !first.emojiLoading &&
      !second.emojiLoading,
    'Only the button that kept the panel open may stay expanded'
  );
  assert(
    first.shadowRoot.querySelector('button').getAttribute('aria-expanded') ===
      'false' &&
      second.shadowRoot
        .querySelector('button')
        .getAttribute('aria-expanded') === 'true',
    'The expanded state must match the shared panel state'
  );
  second.closeEmojiPicker();
});
