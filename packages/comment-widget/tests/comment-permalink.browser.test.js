import { afterEach, expect, test, vi } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

const originalUrl = location.href;
afterEach(() => {
  history.replaceState(null, '', originalUrl);
  window.scrollTo(0, 0);
});
const root = '/apis/api.halo.run/v1alpha1/comments';
const replyPath = '/apis/api.halo.run/v1alpha1/comments/c1/reply/r99';
const comment = {
  permalink: '/archives/canonical?lang=en#halo-comment=c1',
  metadata: { name: 'c1' },
  spec: {
    subjectRef: { group: 'content.halo.run', kind: 'Post', name: 'post' },
    content: '<p>Parent comment</p>',
    creationTime: '2026-09-11T08:12:00Z',
    approved: true,
    hidden: false,
    owner: { kind: 'User', name: '', annotations: {} },
  },
  owner: { displayName: 'Reader' },
  stats: { upvote: 1 },
  status: { visibleReplyCount: 99 },
};
const reply = {
  permalink: 'https://frontend.example/discussion#halo-comment=c1&reply=r99',
  metadata: { name: 'r99' },
  spec: { ...comment.spec, content: '<p>Target reply</p>', commentName: 'c1' },
  owner: { displayName: 'Author' },
  stats: { upvote: 2 },
};
const list = (items) => ({
  items,
  page: 1,
  size: 20,
  total: items.length,
  totalPages: 1,
  hasNext: false,
});

function api(overrides = {}) {
  const requests = [];
  mockApi(async (input) => {
    const url = new URL(String(input), location.href);
    requests.push(url.pathname);
    if (overrides[url.pathname]) return overrides[url.pathname]();
    let data = {};
    if (url.pathname.endsWith('/globalinfo'))
      data = { allowAnonymousComments: true };
    else if (url.pathname.endsWith('/config'))
      data = {
        basic: {},
        avatar: { enable: false },
        editor: { enableEmoji: false },
      };
    else if (url.pathname.endsWith('/users/-'))
      data = { user: { metadata: { name: 'anonymousUser' }, spec: {} } };
    else if (url.pathname === `${root}/c1`) data = comment;
    else if (url.pathname === replyPath) data = reply;
    else if (url.pathname === `${root}/c1/reply`) data = list([reply]);
    else if (url.pathname === root) data = list([comment]);
    return Response.json(data);
  });
  return requests;
}

async function mount(hash) {
  history.replaceState(
    null,
    '',
    `${location.pathname}${location.search}${hash}`
  );
  await import('../src/index.ts');
  const widget = document.createElement('comment-widget');
  widget.group = 'content.halo.run';
  widget.kind = 'Post';
  widget.name = 'post';
  document.body.append(widget);
  await until(() => widget.isInitialized);
  await widget.updateComplete;
  return widget;
}
const detailOf = (widget) => widget.shadowRoot.querySelector('comment-detail');
const itemOf = (widget) =>
  detailOf(widget)?.shadowRoot.querySelector('comment-item');
const repliesOf = (widget) =>
  itemOf(widget)?.shadowRoot.querySelector('comment-replies');

async function lazyContainer(hash) {
  history.replaceState(
    null,
    '',
    `${location.pathname}${location.search}${hash}`
  );
  const { init } = await import('../../widget/src/index.ts');
  const parent = document.createElement('div');
  parent.id = 'theme-comments';
  parent.style.cssText = 'margin: 200vh 0; min-height: 1px';
  document.body.append(parent);
  window.scrollTo(0, 0);
  const scroll = vi.spyOn(parent, 'scrollIntoView');
  init('#theme-comments', {
    group: 'content.halo.run',
    kind: 'Post',
    name: 'post',
  });
  return { parent, scroll };
}

test.each(['#halo-comment=c1', '#halo-comment=c1&reply=r99'])(
  'an offscreen permalink mounts immediately and scrolls only its target (%s)',
  async (hash) => {
    const requests = api();
    const allScrolls = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { parent } = await lazyContainer(hash);
    expect(parent.childElementCount).toBe(1);
    const widget = parent.firstElementChild;
    await until(() => repliesOf(widget)?.replies.length === 1);
    await until(() => allScrolls.mock.calls.length > 0);
    expect(allScrolls).toHaveBeenCalledTimes(1);
    expect(allScrolls.mock.instances[0].tagName).toBe(
      hash.includes('reply=') ? 'REPLY-ITEM' : 'COMMENT-DETAIL'
    );
    expect(window.scrollY).toBeGreaterThan(0);
    expect(requests).not.toContain(root);
    expect(parent.childElementCount).toBe(1);
  }
);

test.each(['', '#chapter', '#halo-comment=', '#reply=r99'])(
  'the plugin entry keeps ordinary visits lazy (%s)',
  async (hash) => {
    const requests = api();
    const { parent, scroll } = await lazyContainer(hash);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    expect(parent.childElementCount).toBe(0);
    expect(requests).toHaveLength(0);
    expect(scroll).not.toHaveBeenCalled();
    parent.scrollIntoView();
    await until(() => parent.firstElementChild?.isInitialized);
    await until(() => requests.includes(root));
    history.replaceState(null, '', '#halo-comment=c1');
    window.dispatchEvent(new Event('hashchange'));
    await until(() => itemOf(parent.firstElementChild));
    expect(parent.childElementCount).toBe(1);
    expect(scroll).toHaveBeenCalledTimes(1);
  }
);

test.each(['hashchange', 'popstate'])(
  'the plugin entry wakes an offscreen widget on %s and then leaves scrolling to the component',
  async (event) => {
    api();
    const { parent, scroll } = await lazyContainer('');
    expect(parent.childElementCount).toBe(0);
    history.replaceState(null, '', '#halo-comment=c1&reply=r99');
    window.dispatchEvent(new Event(event));
    expect(parent.childElementCount).toBe(1);
    expect(scroll).not.toHaveBeenCalled();
    const widget = parent.firstElementChild;
    await until(() => repliesOf(widget)?.replies.length === 1);
    history.replaceState(null, '', '#halo-comment=c1');
    window.dispatchEvent(new Event(event));
    await until(() => itemOf(widget) && !detailOf(widget).target.replyName);
    expect(parent.firstElementChild).toBe(widget);
    expect(scroll).not.toHaveBeenCalled();
  }
);

test.each(['#halo-comment=c1', '#halo-comment=c1&reply=r99'])(
  'a named target waits for the theme to reveal the page and scrolls once (%s)',
  async (hash) => {
    const requests = api();
    const allScrolls = vi.spyOn(Element.prototype, 'scrollIntoView');
    document.body.hidden = true;
    try {
      const { parent } = await lazyContainer(hash);
      expect(parent.childElementCount).toBe(0);
      expect(requests).toHaveLength(0);
      document.body.hidden = false;
      await until(() => allScrolls.mock.calls.length > 0);
      expect(allScrolls).toHaveBeenCalledTimes(1);
      expect(allScrolls.mock.instances[0].tagName).toBe(
        hash.includes('reply=') ? 'REPLY-ITEM' : 'COMMENT-DETAIL'
      );
      expect(window.scrollY).toBeGreaterThan(0);
    } finally {
      document.body.hidden = false;
    }
  }
);

test.each(['initial', 'hashchange', 'popstate'])(
  'the bare comment anchor scrolls to the list before and after mounting (%s)',
  async (event) => {
    const requests = api();
    const { parent, scroll } = await lazyContainer(
      event === 'initial' ? '#halo-comment' : ''
    );
    if (event === 'hashchange') {
      location.hash = '#halo-comment';
      await until(() => parent.childElementCount === 1);
    } else if (event === 'popstate') {
      history.replaceState(null, '', '#halo-comment');
      window.dispatchEvent(new Event(event));
    }
    expect(parent.childElementCount).toBe(1);
    expect(scroll).toHaveBeenCalledExactlyOnceWith({
      block: 'start',
      behavior: 'instant',
    });
    expect(window.scrollY).toBeGreaterThan(0);
    const widget = parent.firstElementChild;
    await until(
      () =>
        widget.shadowRoot.querySelector('comment-list')?.comments.items.length
    );
    expect(detailOf(widget)).toBeNull();
    expect(requests).not.toContain(`${root}/c1`);

    history.replaceState(null, '', '#halo-comment=c1&reply=r99');
    window.dispatchEvent(new Event('hashchange'));
    await until(() => repliesOf(widget)?.replies.length === 1);
    expect(scroll).toHaveBeenCalledTimes(1);
    window.scrollTo(0, 0);
    history.replaceState(null, '', '#halo-comment');
    window.dispatchEvent(new Event('hashchange'));
    expect(scroll).toHaveBeenCalledTimes(2);
    expect(window.scrollY).toBeGreaterThan(0);
    await until(
      () =>
        widget.shadowRoot.querySelector('comment-list')?.comments.items.length
    );
    expect(detailOf(widget)).toBeNull();
    expect(parent.firstElementChild).toBe(widget);
  }
);

test('the comment anchor scrolls after the theme reveals the page', async () => {
  api();
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'smooth';
  document.body.hidden = true;
  try {
    const { parent, scroll } = await lazyContainer('#halo-comment');
    let scrolledImmediately = false;
    scroll.mockImplementation((options) => {
      Element.prototype.scrollIntoView.call(parent, options);
      scrolledImmediately = window.scrollY > 0;
    });
    const widget = parent.firstElementChild;
    await until(
      () =>
        widget?.shadowRoot.querySelector('comment-list')?.comments.items.length
    );
    expect(window.scrollY).toBe(0);
    document.body.hidden = false;
    await until(() => {
      const rect = parent.getBoundingClientRect();
      return rect.top >= 0 && rect.top < innerHeight;
    });
    expect(scrolledImmediately).toBe(true);
    expect(scroll).toHaveBeenCalledExactlyOnceWith({
      block: 'start',
      behavior: 'instant',
    });
  } finally {
    document.body.hidden = false;
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  }
});

test('comment detail skips the list, loads replies, returns to the list and follows history', async () => {
  const requests = api();
  const widget = await mount('#halo-comment=c1');
  await until(() => repliesOf(widget)?.replies.length === 1);
  expect(requests).not.toContain(root);
  expect(itemOf(widget).showReplies).toBe(true);
  detailOf(widget).shadowRoot.querySelector('.back').click();
  await until(
    () =>
      widget.shadowRoot.querySelector('comment-list')?.comments.items.length ===
      1
  );
  expect(location.hash).toBe('');
  expect(requests.filter((path) => path === root)).toHaveLength(1);
  history.back();
  await until(() => repliesOf(widget)?.replies.length === 1);
  expect(location.hash).toBe('#halo-comment=c1');
  expect(requests.filter((path) => path === root)).toHaveLength(1);
});

test('reply detail loads only the target until all replies are requested', async () => {
  const requests = api();
  const widget = await mount('#halo-comment=c1&reply=r99');
  await until(() => repliesOf(widget)?.replies.length === 1);
  const replies = repliesOf(widget);
  await replies.updateComplete;
  expect(requests).toContain(replyPath);
  expect(requests).not.toContain(root);
  expect(requests).not.toContain(`${root}/c1/reply`);
  expect(replies.replies[0].metadata.name).toBe('r99');
  expect(replies.shadowRoot.querySelector('.target-reply')).not.toBeNull();
  replies.shadowRoot.querySelector('button').click();
  await until(() => requests.includes(`${root}/c1/reply`));
  expect(requests).not.toContain(root);
});

test.each(['missing', 'missing-reply'])(
  'unavailable detail (%s) does not render foreign content or fall back to a list',
  async (reason) => {
    const overrides = {
      [reason === 'missing-reply' ? replyPath : `${root}/c1`]: () =>
        new Response('', { status: 404 }),
    };
    const requests = api(overrides);
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const widget = await mount('#halo-comment=c1&reply=r99');
    await until(() =>
      detailOf(widget)?.shadowRoot.querySelector('[role=status]')
    );
    expect(itemOf(widget)).toBeNull();
    expect(detailOf(widget).shadowRoot.querySelector('.retry')).toBeNull();
    expect(requests).not.toContain(root);
    expect(requests).not.toContain(`${root}/c1/reply`);
    if (reason !== 'missing-reply') expect(requests).not.toContain(replyPath);
    expect(detailOf(widget).shadowRoot.textContent).toContain(
      'Comment not found or unavailable'
    );
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.instances[0]).toBe(detailOf(widget));
  }
);

test('returning to list ignores an in-flight detail response', async () => {
  let resolve;
  const requests = api({
    [`${root}/c1`]: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const widget = await mount('#halo-comment=c1&reply=r99');
  await until(() => resolve);
  detailOf(widget).shadowRoot.querySelector('.back').click();
  await until(() => widget.shadowRoot.querySelector('comment-list'));
  resolve(Response.json(comment));
  await new Promise((done) => setTimeout(done, 50));
  expect(detailOf(widget)).toBeNull();
  expect(requests).not.toContain(replyPath);
});

test('timestamps open a copyable frontend URL, select it, close with Escape and outside click', async () => {
  api();
  const widget = await mount('#halo-comment=c1&reply=r99');
  await until(() => repliesOf(widget)?.replies.length === 1);
  const replies = repliesOf(widget);
  await replies.updateComplete;
  const replyItem = replies.shadowRoot.querySelector('reply-item');
  await replyItem.updateComplete;
  const baseItem = replyItem.shadowRoot.querySelector('base-comment-item');
  await baseItem.updateComplete;
  const link = baseItem.shadowRoot.querySelector('comment-link');
  await link.updateComplete;
  const trigger = link.shadowRoot.querySelector('.trigger');
  trigger.click();
  await until(() => link.shadowRoot.querySelector('input'));
  const input = link.shadowRoot.querySelector('input');
  expect(input.value).toBe(reply.permalink);
  expect(input.readOnly).toBe(true);
  await until(() => input.selectionEnd === input.value.length);
  const clipboard = vi
    .spyOn(navigator.clipboard, 'writeText')
    .mockResolvedValue();
  link.shadowRoot.querySelector('.copy').click();
  await until(
    () =>
      link.shadowRoot.querySelector('[role=status]').textContent ===
      'Link copied'
  );
  expect(clipboard).toHaveBeenCalledWith(input.value);
  input.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
    })
  );
  await link.updateComplete;
  expect(link.shadowRoot.querySelector('input')).toBeNull();
  expect(link.shadowRoot.activeElement).toBe(trigger);
  trigger.click();
  await until(() => link.shadowRoot.querySelector('input'));
  document.body.click();
  await link.updateComplete;
  expect(link.shadowRoot.querySelector('input')).toBeNull();
});

test('a new root comment exits detail mode and loads the normal list once', async () => {
  const requests = api();
  const widget = await mount('#halo-comment=c1');
  await until(() => itemOf(widget));
  window.dispatchEvent(new CustomEvent('halo:comment:created'));
  await until(
    () => widget.shadowRoot.querySelector('comment-list')?.comments.items.length
  );
  expect(requests.filter((path) => path === root)).toHaveLength(1);
  expect(location.hash).toBe('');
});

test('copy failure keeps the link selected for manual copying on a narrow screen', async () => {
  const { page } = await import('vitest/browser');
  await page.viewport(390, 844);
  await import('../src/comment-link.ts');
  const link = document.createElement('comment-link');
  link.permalink = comment.permalink;
  link.creationTime = comment.spec.creationTime;
  document.body.append(link);
  await link.updateComplete;
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Denied')
  );
  link.shadowRoot.querySelector('.trigger').click();
  await until(() => link.shadowRoot.querySelector('input')?.selectionEnd);
  link.shadowRoot.querySelector('.copy').click();
  await until(() =>
    link.shadowRoot
      .querySelector('[role=status]')
      .textContent.includes('manually')
  );
  const input = link.shadowRoot.querySelector('input');
  expect(input.selectionEnd).toBe(input.value.length);
  const panel = link.shadowRoot.querySelector('.panel');
  await until(() => panel.style.left);
  expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
  expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(innerWidth);
  expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
  await page.viewport(1200, 800);
});

test('view-all preserves focus while loading and moves it to the replies', async () => {
  let resolveList;
  const requests = api({
    [`${root}/c1/reply`]: () =>
      new Promise((resolve) => {
        resolveList = resolve;
      }),
  });
  const widget = await mount('#halo-comment=c1&reply=r99');
  await until(() => repliesOf(widget)?.replies.length === 1);
  const replies = repliesOf(widget);
  await replies.updateComplete;
  const button = replies.shadowRoot.querySelector('button');
  button.focus();
  expect(replies.shadowRoot.activeElement).toBe(button);
  button.click();
  await until(() => resolveList && replies.loading);
  await replies.updateComplete;
  button.click();
  expect(requests.filter((path) => path === `${root}/c1/reply`)).toHaveLength(
    1
  );
  expect(replies.shadowRoot.activeElement).toBe(button);
  resolveList(Response.json(list([reply])));
  await until(() => !replies.loading);
  await replies.updateComplete;
  expect(replies.shadowRoot.activeElement).toBe(
    replies.shadowRoot.querySelector('reply-item')
  );
});

test('collapsing detail replies preserves the expanded list', async () => {
  const other = { ...reply, metadata: { name: 'r100' } };
  api({ [`${root}/c1/reply`]: () => Response.json(list([reply, other])) });
  const widget = await mount('#halo-comment=c1&reply=r99');
  await until(() => repliesOf(widget)?.replies.length === 1);
  const replies = repliesOf(widget);
  await replies.updateComplete;
  replies.shadowRoot.querySelector('button').click();
  await until(() => replies.replies.length === 2);
  const item = itemOf(widget);
  item.shadowRoot.querySelector('.show-replies-button').click();
  await until(() => repliesOf(widget)?.hidden);
  expect(replies.getClientRects()).toHaveLength(0);
  item.shadowRoot.querySelector('.show-replies-button').click();
  await until(() => !repliesOf(widget)?.hidden);
  expect(repliesOf(widget)).toBe(replies);
  expect(repliesOf(widget).replies).toHaveLength(2);
  expect(repliesOf(widget).shadowRoot.textContent).not.toContain(
    'View all replies'
  );
});
test('returning to the list moves keyboard focus to the list', async () => {
  api();
  const widget = await mount('#halo-comment=c1&reply=r99');
  await until(() => repliesOf(widget)?.replies.length === 1);
  const detail = detailOf(widget);
  const back = detail.shadowRoot.querySelector('.back');
  back.focus();
  expect(detail.shadowRoot.activeElement).toBe(back);
  back.click();
  await until(
    () => widget.shadowRoot.querySelector('comment-list')?.comments.items.length
  );
  expect(widget.shadowRoot.activeElement).toBe(
    widget.shadowRoot.querySelector('comment-list')
  );
});

test('list timestamps copy the Core relative permalink using the frontend URL', async () => {
  api();
  const widget = await mount('');
  widget.baseUrl = 'https://api.example';
  const list = widget.shadowRoot.querySelector('comment-list');
  await until(() => list?.comments.items.length);
  await list.updateComplete;
  const item = list.shadowRoot.querySelector('comment-item');
  await item.updateComplete;
  const base = item.shadowRoot.querySelector('base-comment-item');
  await base.updateComplete;
  const link = base.shadowRoot.querySelector('comment-link');
  await link.updateComplete;
  link.shadowRoot.querySelector('.trigger').click();
  await until(() => link.shadowRoot.querySelector('input'));
  const expected = new URL(comment.permalink, location.href).href;
  expect(link.shadowRoot.querySelector('input').value).toBe(expected);
  const clipboard = vi
    .spyOn(navigator.clipboard, 'writeText')
    .mockResolvedValue();
  link.shadowRoot.querySelector('.copy').click();
  await until(() => clipboard.mock.calls.length);
  expect(clipboard).toHaveBeenCalledWith(expected);
});

test.each([undefined, null, ''])(
  'missing permalink (%s) renders only the date',
  async (permalink) => {
    api({
      [`${root}/c1`]: () => Response.json({ ...comment, permalink }),
      [replyPath]: () => Response.json({ ...reply, permalink }),
    });
    const widget = await mount('#halo-comment=c1&reply=r99');
    await until(() => repliesOf(widget)?.replies.length === 1);
    const replies = repliesOf(widget);
    await replies.updateComplete;
    const replyItem = replies.shadowRoot.querySelector('reply-item');
    for (const item of [itemOf(widget), replyItem]) {
      await item.updateComplete;
      const base = item.shadowRoot.querySelector('base-comment-item');
      await base.updateComplete;
      const link = base.shadowRoot.querySelector('comment-link');
      await link.updateComplete;
      expect(link.shadowRoot.querySelector('time')).not.toBeNull();
      expect(link.shadowRoot.querySelector('button')).toBeNull();
      expect(link.shadowRoot.querySelector('input')).toBeNull();
    }
  }
);

test.each([`${root}/c1`, replyPath])(
  'a failed Core request (%s) can be retried without loading the list',
  async (path) => {
    let fail = true;
    const requests = api({
      [path]: () =>
        fail
          ? new Response('', { status: 503 })
          : Response.json(path === replyPath ? reply : comment),
    });
    const widget = await mount('#halo-comment=c1&reply=r99');
    await until(() => detailOf(widget)?.shadowRoot.querySelector('.retry'));
    const detail = detailOf(widget);
    const retry = detail.shadowRoot.querySelector('.retry');
    retry.focus();
    fail = false;
    retry.click();
    await until(() => repliesOf(widget)?.replies.length === 1);
    expect(widget.shadowRoot.activeElement).toBe(detail);
    expect(requests).not.toContain(root);
    expect(requests.filter((url) => url === path)).toHaveLength(2);
    expect(detail.shadowRoot.querySelector('.retry')).toBeNull();
  }
);

test('management reload preserves keyboard focus after pinning a comment', async () => {
  let pinned = false;
  const requests = api({
    '/apis/api.console.halo.run/v1alpha1/users/-': () =>
      Response.json({ user: { metadata: { name: 'admin' }, spec: {} } }),
    '/apis/api.console.halo.run/v1alpha1/users/-/permissions': () =>
      Response.json({ uiPermissions: ['*'] }),
    '/apis/content.halo.run/v1alpha1/comments/c1': () => {
      pinned = true;
      return Response.json({});
    },
    [`${root}/c1`]: () =>
      Response.json({ ...comment, spec: { ...comment.spec, top: pinned } }),
  });
  const widget = await mount('#halo-comment=c1');
  await until(() => itemOf(widget));
  const oldItem = itemOf(widget);
  await oldItem.updateComplete;
  const management = oldItem.shadowRoot.querySelector('comment-management');
  await management.updateComplete;
  management.shadowRoot.querySelector('summary').click();
  await management.updateComplete;
  const pin = [...management.shadowRoot.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === 'Pin'
  );
  pin.focus();
  expect(management.matches(':focus-within')).toBe(true);
  pin.click();
  await until(
    () =>
      itemOf(widget) &&
      itemOf(widget) !== oldItem &&
      itemOf(widget).comment.spec.top
  );
  expect(requests).toContain('/apis/content.halo.run/v1alpha1/comments/c1');
  expect(widget.shadowRoot.activeElement).toBe(detailOf(widget));
});

test.each(['#halo-comment=c1', '#halo-comment=c1&reply=r99'])(
  'mounted widget locates a target loaded while hidden (%s)',
  async (hash) => {
    api();
    const { parent } = await lazyContainer('');
    parent.scrollIntoView();
    await until(() => parent.firstElementChild?.isInitialized);
    const widget = parent.firstElementChild;
    await until(
      () =>
        widget.shadowRoot.querySelector('comment-list')?.comments.items.length
    );
    parent.hidden = true;
    window.scrollTo(0, 0);
    history.replaceState(null, '', hash);
    window.dispatchEvent(new Event('hashchange'));
    await until(() => repliesOf(widget)?.replies.length === 1);
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
    parent.hidden = false;
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
    await until(() => window.scrollY > 0);
    expect(parent.getBoundingClientRect().top).toBeLessThan(innerHeight);
  }
);

test('a later nonmatching widget keeps its list without stealing the target scroll', async () => {
  let resolveForeign;
  let calls = 0;
  api({
    [`${root}/c1`]: () =>
      ++calls === 1
        ? Response.json(comment)
        : new Promise((resolve) => {
            resolveForeign = resolve;
          }),
  });
  const scrolls = vi.spyOn(Element.prototype, 'scrollIntoView');
  const target = await mount('#halo-comment=c1');
  await until(() => repliesOf(target)?.replies.length === 1);
  const foreign = document.createElement('comment-widget');
  foreign.group = target.group;
  foreign.kind = target.kind;
  foreign.name = 'other';
  document.body.append(foreign);
  await until(() => resolveForeign);
  resolveForeign(Response.json(comment));
  await until(() => foreign.shadowRoot.querySelector('comment-list'));
  expect(location.hash).toBe('#halo-comment=c1');
  expect(scrolls.mock.instances.at(-1)).toBe(detailOf(target));
  expect(detailOf(foreign)).toBeNull();
});

test.each(['#halo-comment=c1', '#halo-comment=c1&reply=r99'])(
  'leaving a hidden target cancels its pending scroll (%s)',
  async (hash) => {
    api();
    const widget = await mount('');
    widget.style.display = 'none';
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    history.replaceState(null, '', hash);
    window.dispatchEvent(new Event('hashchange'));
    await until(() => repliesOf(widget)?.replies.length === 1);
    expect(detailOf(widget).getClientRects()).toHaveLength(0);
    expect(scroll).not.toHaveBeenCalled();
    history.replaceState(null, '', location.pathname);
    window.dispatchEvent(new Event('hashchange'));
    await until(() => !detailOf(widget));
    widget.style.display = '';
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    expect(scroll).not.toHaveBeenCalled();
  }
);

test('a mismatched widget rechecks the permalink when its subject changes', async () => {
  const requests = api();
  const widget = await mount('');
  widget.name = 'other';
  history.replaceState(null, '', '#halo-comment=c1');
  window.dispatchEvent(new Event('hashchange'));
  await until(() => requests.includes(`${root}/c1`) && !detailOf(widget));
  widget.name = 'post';
  await until(() => itemOf(widget));
  expect(itemOf(widget).comment.metadata.name).toBe('c1');
  expect(location.hash).toBe('#halo-comment=c1');
});
