import { assert, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../src/comment-pagination';

test('Page dropdown supports selection, dismissal, theme colors and scrolling', async () => {
  const pagination = document.createElement('comment-pagination');
  pagination.total = 1000;
  document.body.append(pagination);
  await pagination.updateComplete;
  const root = pagination.shadowRoot;
  const trigger = root.querySelector('.pagination-trigger');
  const dropdown = root.querySelector('.pagination-pages');
  const details = root.querySelector('details');
  const buttons = dropdown.querySelectorAll('button');
  const change = vi.fn();
  pagination.addEventListener('page-change', change);

  for (const dark of [false, true]) {
    document.body.classList.toggle('color-scheme-dark', dark);
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => assert.equal(root.activeElement, buttons[0]));
    assert(details.open);
    assert.equal(
      getComputedStyle(dropdown).backgroundColor,
      dark ? 'rgb(51, 65, 85)' : 'rgb(241, 245, 249)'
    );
    assert.equal(
      getComputedStyle(dropdown).color,
      dark ? 'rgb(249, 250, 251)' : 'rgb(15, 23, 42)'
    );
    assert(dropdown.scrollHeight > dropdown.clientHeight);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    assert.equal(change.mock.lastCall[0].detail.page, 2);
    assert(!details.open);
    assert.equal(root.activeElement, trigger);
  }
  document.body.classList.remove('color-scheme-dark');

  pagination.page = 2;
  await pagination.updateComplete;
  trigger.click();
  await vi.waitFor(() => assert.equal(root.activeElement, buttons[1]));
  const calls = change.mock.calls.length;
  buttons[1].click();
  assert.equal(
    change.mock.calls.length,
    calls,
    'Selecting the current page does not reload'
  );
  await userEvent.click(trigger);
  await vi.waitFor(() => assert.equal(root.activeElement, buttons[1]));
  await userEvent.keyboard('{Escape}');
  assert(!details.open);
  assert.equal(root.activeElement, trigger);

  pagination.page = 100;
  await pagination.updateComplete;
  trigger.click();
  await vi.waitFor(() => assert.equal(root.activeElement, buttons[99]));
  assert(dropdown.scrollTop > 0, 'Opening reveals the current page');
  await userEvent.keyboard('{Escape}');

  const outside = document.createElement('button');
  outside.textContent = 'Outside';
  document.body.append(outside);
  trigger.click();
  await userEvent.click(outside);
  assert(!details.open);
});

test('Page dropdown stays in view and supports efficient keyboard navigation', async () => {
  const pagination = document.createElement('comment-pagination');
  pagination.total = 1000;
  pagination.page = 50;
  pagination.style.cssText = 'position:fixed;bottom:0;left:0;width:100%';
  document.body.append(pagination);
  await pagination.updateComplete;
  const root = pagination.shadowRoot;
  const trigger = root.querySelector('summary');
  const details = root.querySelector('details');
  const dropdown = root.querySelector('.pagination-pages');
  assert.include(trigger.getAttribute('aria-label'), '50 / 100');
  trigger.focus();
  await userEvent.keyboard('{Enter}');
  await vi.waitFor(() => {
    assert.equal(root.activeElement.textContent.trim(), '50 / 100');
    const rect = dropdown.getBoundingClientRect();
    assert(rect.top >= 0 && rect.bottom <= innerHeight);
    const current = root.activeElement.getBoundingClientRect();
    assert(current.top >= rect.top && current.bottom <= rect.bottom);
  });
  await userEvent.keyboard('{End}');
  assert.equal(root.activeElement.textContent.trim(), '100 / 100');
  await userEvent.keyboard('{Home}{ArrowDown}');
  assert.equal(root.activeElement.textContent.trim(), '2 / 100');
  await userEvent.keyboard('{ArrowUp}');
  assert.equal(root.activeElement.textContent.trim(), '1 / 100');
  assert.equal(dropdown.querySelectorAll('[tabindex="0"]').length, 1);
  await userEvent.keyboard('{Tab}');
  assert(!details.open, 'Tab leaves the dropdown without visiting every page');
  assert.equal(root.activeElement.getAttribute('rel'), 'next');
  trigger.focus();
  const onEscape = vi.fn();
  document.addEventListener('keydown', onEscape);
  await userEvent.keyboard('{Escape}');
  document.removeEventListener('keydown', onEscape);
  assert.equal(
    onEscape.mock.calls.length,
    1,
    'Closed dropdown does not swallow Escape'
  );
});
