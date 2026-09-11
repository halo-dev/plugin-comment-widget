import { assert, test } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test('Comment widget accessibility checks', async () => {
  const locale = 'en';
  document.body.innerHTML =
    '<main style="max-width:720px;margin:auto"><div id="fixtures"></div></main>';
  // biome-ignore lint/suspicious/noDocumentCookie: Exercise the widget's existing locale cookie contract.
  document.cookie = `language=${locale}; path=/`;
  document.documentElement.lang = locale;
  const comment = {
    metadata: { name: 'comment-1' },
    spec: {
      content: '<p>Comment content</p>',
      approved: true,
      owner: {},
      creationTime: '2024-01-02T03:04:00Z',
      userAgent: 'UnknownAgent'.repeat(30),
    },
    owner: { displayName: 'LongName'.repeat(30) },
    stats: { upvote: 0 },
    status: { visibleReplyCount: 60 },
  };
  const replies = Array.from({ length: 60 }, (_, index) => ({
    ...structuredClone(comment),
    metadata: { name: `reply-${index}` },
    spec: {
      ...comment.spec,
      content: `<p>Reply ${index}</p>`,
      commentName: 'comment-1',
    },
  }));
  const pageOf = (items, page = 1, size = 20) => ({
    items: items.slice((page - 1) * size, page * size),
    page,
    size,
    total: items.length,
    totalPages: Math.ceil(items.length / size),
    hasNext: page * size < items.length,
    hasPrevious: page > 1,
  });
  let pauseReplies = false;
  let releaseReplies;
  let failReplies = false;
  let captchaRequests = 0;
  mockApi(async (input) => {
    const url = new URL(String(input), location.href);
    let data = {};
    if (url.pathname.endsWith('/globalinfo'))
      data = { allowAnonymousComments: true };
    else if (url.pathname.endsWith('/config'))
      data = {
        basic: {
          withReplies: true,
          replySize: 20,
          enablePrivateComment: true,
          showCommenterDevice: true,
        },
        avatar: { enable: false },
        security: { captcha: { type: 'DEFAULT' } },
        captchaRequired: true,
      };
    else if (url.pathname.endsWith('/users/-'))
      data = { user: { metadata: { name: 'anonymousUser' }, spec: {} } };
    else if (url.pathname.endsWith('/generate')) {
      captchaRequests++;
      return new Response(
        `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text x="10" y="25">ABCD</text></svg>')}`
      );
    } else if (url.pathname.endsWith('/reply')) {
      if (pauseReplies)
        await new Promise((resolve) => {
          releaseReplies = resolve;
        });
      if (failReplies) return new Response('{}', { status: 400 });
      data = pageOf(
        replies,
        Number(url.searchParams.get('page')),
        Number(url.searchParams.get('size'))
      );
    } else if (url.pathname.endsWith('/comments')) data = pageOf([comment]);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  function leavingIsPrevented() {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }
  await import('../src/index.ts');
  const fixtures = document.querySelector('#fixtures');
  const widget = document.createElement('comment-widget');
  fixtures.append(widget);
  await until(
    () =>
      widget.shadowRoot
        ?.querySelector('comment-form')
        ?.shadowRoot?.querySelector('base-form')?.editorRef.value?.editor
  );
  const form = widget.shadowRoot
    .querySelector('comment-form')
    .shadowRoot.querySelector('base-form');
  const editor = form.editorRef.value;
  const textbox = editor.shadowRoot.querySelector('[contenteditable="true"]');
  assert(
    textbox.getAttribute('role') === 'textbox' &&
      textbox.getAttribute('aria-label'),
    'Editor needs a named textbox'
  );
  for (const input of form.shadowRoot.querySelectorAll(
    'input:not([type="checkbox"])'
  )) {
    assert(
      input.getAttribute('aria-label') && input.autocomplete,
      'Inputs need names and autocomplete'
    );
  }
  assert(
    !form.shadowRoot.querySelector('[name="email"]').spellcheck,
    'Email must not spellcheck'
  );
  const login = form.shadowRoot.querySelector('.form-login-link');
  assert(
    login instanceof HTMLAnchorElement && login.tabIndex === 0,
    'Login must be keyboard-accessible navigation'
  );
  const toolbar = [...editor.shadowRoot.querySelectorAll('li > button')];
  assert(
    toolbar.length === 7 &&
      toolbar.every(
        (button) => button.tabIndex === 0 && button.getAttribute('aria-label')
      ),
    'All formatting actions must be named native buttons'
  );
  toolbar[0].focus();
  assert(
    editor.shadowRoot.activeElement === toolbar[0],
    'Toolbar must accept focus'
  );
  assert(
    getComputedStyle(toolbar[0]).outlineStyle !== 'none',
    'Toolbar focus must be visible'
  );

  const emoji = editor.shadowRoot.querySelector('emoji-button');
  await emoji.handleOpenEmojiPicker(new MouseEvent('click'));
  await until(() =>
    document
      .querySelector('em-emoji-picker')
      ?.shadowRoot?.querySelector('input')
  );
  const picker = document.querySelector('em-emoji-picker');
  const dismissEmoji = () =>
    picker.shadowRoot.querySelector('input').dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  dismissEmoji();
  assert(
    !emoji.emojiPickerVisible &&
      emoji.shadowRoot.activeElement ===
        emoji.shadowRoot.querySelector('button'),
    'Escape from the emoji picker must return focus to its trigger'
  );
  await emoji.handleOpenEmojiPicker(new MouseEvent('click'));
  assert(
    picker.shadowRoot.activeElement?.tagName === 'INPUT',
    'Reopening the picker must focus its search field'
  );
  dismissEmoji();

  assert(!leavingIsPrevented(), 'An empty form must allow navigation');
  editor.editor.commands.setContent('<p>Unsaved draft</p>');
  assert(leavingIsPrevented(), 'A draft must warn before leaving');
  editor.editor.commands.clearContent();
  assert(!leavingIsPrevented(), 'Clearing the draft must remove the warning');
  editor.editor.commands.setContent('<p>Submitted draft</p>');
  form.resetForm();
  assert(!leavingIsPrevented(), 'Reset after submit must remove the warning');

  await until(() => form.shadowRoot.querySelector('.form-captcha button'));
  const refresh = form.shadowRoot.querySelector('.form-captcha button');
  const expectedRefresh = {
    en: 'Refresh verification code',
    'zh-CN': '刷新验证码',
    'zh-TW': '重新整理驗證碼',
    es: 'Actualizar código de verificación',
  };
  assert(
    refresh.getAttribute('aria-label') === expectedRefresh[locale],
    'Captcha refresh label must be localized'
  );
  refresh.click();
  await until(() => captchaRequests >= 2);
  const tooltip = form.shadowRoot.querySelector('base-tooltip');
  const trigger = tooltip.querySelector('button');
  trigger.focus();
  assert(
    getComputedStyle(tooltip.shadowRoot.querySelector('[role="tooltip"]'))
      .visibility === 'visible',
    'Focus must show the tooltip'
  );
  assert(
    form.shadowRoot
      .getElementById(trigger.getAttribute('aria-describedby'))
      .textContent.trim(),
    'Tooltip description must resolve in the trigger scope'
  );
  trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
  );
  assert(
    getComputedStyle(tooltip.shadowRoot.querySelector('[role="tooltip"]'))
      .visibility === 'hidden',
    'Escape must dismiss the tooltip'
  );

  const pagination = document.createElement('comment-pagination');
  pagination.total = 60;
  fixtures.append(pagination);
  await pagination.updateComplete;
  const select = pagination.shadowRoot.querySelector('select');
  assert(select.getAttribute('aria-label'), 'Page selector needs a name');
  select.focus();
  assert(
    getComputedStyle(select).outlineStyle !== 'none',
    'Page selector focus must be visible'
  );

  const list = widget.shadowRoot.querySelector('comment-list');
  await until(
    () =>
      list.shadowRoot
        ?.querySelector('comment-item')
        ?.shadowRoot?.querySelector('comment-replies')?.replies.length === 20
  );
  const item = list.shadowRoot.querySelector('comment-item');
  const base = item.shadowRoot.querySelector('base-comment-item');
  const replyList = item.shadowRoot.querySelector('comment-replies');
  const loadMore = replyList.shadowRoot.querySelector('.replies-next-button');
  pauseReplies = true;
  loadMore.focus();
  loadMore.click();
  await until(() => releaseReplies);
  assert(
    replyList.shadowRoot.activeElement === loadMore && loadMore.isConnected,
    'Loading must retain button focus'
  );
  assert(
    loadMore.getAttribute('aria-disabled') === 'true',
    'Loading must expose its unavailable state'
  );
  pauseReplies = false;
  releaseReplies();
  await until(() => replyList.replies.length === 40 && !replyList.loading);
  assert(
    replyList.shadowRoot.activeElement === loadMore,
    'The next-page button must retain focus'
  );
  failReplies = true;
  await replyList.fetchNext();
  assert(
    replyList.shadowRoot.activeElement === loadMore && !replyList.loading,
    'Failed loading must retain focus and allow retry'
  );
  failReplies = false;
  await replyList.fetchNext();
  assert(replyList.replies.length === 60, 'The final page must append replies');
  assert(
    replyList.shadowRoot.activeElement ===
      replyList.shadowRoot.querySelectorAll('reply-item')[40],
    'Final page must focus the first new reply'
  );
  const firstNewReply = replyList.shadowRoot.querySelectorAll('reply-item')[40];
  select.focus();
  assert(
    !firstNewReply.hasAttribute('tabindex'),
    'Leaving the new reply must restore its shadow controls to the Tab order'
  );
  assert(
    getComputedStyle(base.shadowRoot.querySelector('.item-content'))
      .contentVisibility === 'auto',
    'Offscreen comment content should skip rendering'
  );
  assert(
    base.shadowRoot.querySelector('time').title ===
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(comment.spec.creationTime)),
    'Dates must use the active locale'
  );
  base.creationTime = 'invalid';
  await base.updateComplete;
  assert(
    base.shadowRoot.querySelector('time').title === '',
    'Invalid dates must not crash rendering'
  );
  base.creationTime = comment.spec.creationTime;
  const toastContainer = document.querySelector('lit-toast-container');
  assert(
    toastContainer.getAttribute('role') === 'status' &&
      toastContainer.getAttribute('aria-live') === 'polite',
    'Toasts must be announced through a persistent live region'
  );

  const detachedForm = document.createElement('base-form');
  fixtures.append(detachedForm);
  await until(() => detachedForm.editorRef.value?.editor);
  detachedForm.editorRef.value.editor.commands.setContent(
    '<p>Discarded form</p>'
  );
  assert(leavingIsPrevented(), 'A second form must protect its draft');
  detachedForm.remove();
  assert(
    !leavingIsPrevented(),
    'Removing a form must clean up its navigation guard'
  );

  const skeleton = document.createElement('comment-editor-skeleton');
  fixtures.append(skeleton);
  await skeleton.updateComplete;
  assert(
    skeleton.shadowRoot.firstElementChild.getAttribute('aria-hidden') ===
      'true',
    'Skeleton must be hidden from assistive technology'
  );
  assert(
    !skeleton.shadowRoot.querySelector('[role="button"]'),
    'Skeleton must not expose fake buttons'
  );
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    base.breath = true;
    await base.updateComplete;
    assert(
      getComputedStyle(base.shadowRoot.querySelector('.item')).animationName ===
        'none',
      'Breathing animation must stop with reduced motion'
    );
    assert(
      getComputedStyle(skeleton.shadowRoot.querySelector('.animate-pulse'))
        .animationName === 'none',
      'Skeleton animation must stop with reduced motion'
    );
    assert(
      getComputedStyle(select.parentElement).transitionProperty === 'none',
      'Transitions must stop with reduced motion'
    );
  }
  skeleton.remove();
  assert(
    document.documentElement.scrollWidth <= innerWidth,
    'Long names, user agents, and toasts must fit the viewport'
  );
});
