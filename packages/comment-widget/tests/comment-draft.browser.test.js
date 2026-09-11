import { assert, test } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test('Comment draft regression checks', async () => {
  const comments = ['draft-comment-a', 'draft-comment-b'].map((name) => ({
    metadata: { name },
    spec: { content: name, approved: true, owner: {} },
    owner: { displayName: name },
    stats: { upvote: 0 },
    status: { visibleReplyCount: 0 },
  }));
  let failSubmit = false;
  let finishSubmit;
  let delaySubmit = false;
  mockApi(async (input, options = {}) => {
    const path = new URL(String(input), location.href).pathname;
    let data = {};
    if (options.method === 'POST') {
      if (delaySubmit)
        await new Promise((resolve) => {
          finishSubmit = resolve;
        });
      if (failSubmit) return new Response('{}', { status: 400 });
      data = { spec: { approved: true } };
    } else if (path.endsWith('/globalinfo'))
      data = { allowAnonymousComments: true };
    else if (path.endsWith('/config'))
      data = {
        basic: { enablePrivateComment: true },
        avatar: { enable: false },
      };
    else if (path.endsWith('/users/-'))
      data = { user: { metadata: { name: 'draft-test-user' }, spec: {} } };
    else if (path.endsWith('/reply'))
      data = { items: [], page: 1, total: 0, totalPages: 0, hasNext: false };
    else if (path.endsWith('/comments'))
      data = {
        items: comments,
        page: 1,
        total: 2,
        totalPages: 1,
        hasNext: false,
      };
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  const keys = () =>
    Object.keys(localStorage).filter(
      (key) =>
        key.startsWith('halo-comment-draft:') && key.includes('draft-test-post')
    );
  const edit = (form, content) =>
    form.editorRef.value.editor.commands.setContent(content);
  const content = (form) => form.editorRef.value.editor.getText();
  const submit = (owner) =>
    owner.onSubmit(
      new CustomEvent('submit', { detail: { content: '<p>draft</p>' } })
    );
  async function base(owner) {
    await until(
      () =>
        owner?.shadowRoot?.querySelector('base-form')?.editorRef.value?.editor
    );
    return owner.shadowRoot.querySelector('base-form');
  }
  async function mount(name = 'draft-test-post') {
    const widget = document.createElement('comment-widget');
    widget.name = name;
    widget.group = 'content.halo.run';
    widget.kind = 'Post';
    document.body.append(widget);
    await until(
      () =>
        widget.shadowRoot
          ?.querySelector('comment-list')
          ?.shadowRoot?.querySelectorAll('comment-item').length === 2
    );
    return widget;
  }
  async function open(item) {
    item.handleToggleReplyForm();
    await until(() => item.shadowRoot?.querySelector('reply-form'));
    const owner = item.shadowRoot.querySelector('reply-form');
    return [owner, await base(owner)];
  }
  await import('../src/index.ts');
  keys().forEach((key) => {
    localStorage.removeItem(key);
  });
  let widget = await mount();
  let rootOwner = widget.shadowRoot.querySelector('comment-form');
  let root = await base(rootOwner);
  edit(root, '<p><strong>root draft</strong></p>');
  root.shadowRoot.querySelector('#hidden').click();
  const items = [
    ...widget.shadowRoot
      .querySelector('comment-list')
      .shadowRoot.querySelectorAll('comment-item'),
  ];
  let [ownerA, formA] = await open(items[0]);
  edit(formA, '<p>reply A</p>');
  const [, formB] = await open(items[1]);
  await until(() => !formA.isConnected);
  assert(content(formB) === '', 'Different reply must start empty');
  edit(formB, '<p>reply B</p>');
  [ownerA, formA] = await open(items[0]);
  assert(content(formA) === 'reply A', 'Switching back must restore reply A');
  failSubmit = true;
  await submit(ownerA);
  assert(
    content(formA) === 'reply A' && keys().length === 3,
    'Failed submission must preserve drafts'
  );
  failSubmit = false;
  delaySubmit = true;
  const pending = submit(ownerA);
  await until(() => finishSubmit);
  await open(items[1]);
  await until(() => !formA.isConnected);
  finishSubmit();
  await pending;
  delaySubmit = false;
  assert(
    keys().length === 2,
    'Successful detached submission must clear only its draft'
  );
  widget.remove();
  widget = await mount();
  rootOwner = widget.shadowRoot.querySelector('comment-form');
  root = await base(rootOwner);
  assert(content(root) === 'root draft', 'Remount must restore root draft');
  assert(
    root.editorRef.value.editor.getHTML().includes('<strong>'),
    'Formatting must survive'
  );
  assert(
    root.shadowRoot.querySelector('#hidden').checked,
    'Private setting must survive'
  );
  const originalUser = root.currentUser;
  root.currentUser = { metadata: { name: 'another-user' }, spec: {} };
  await root.updateComplete;
  await until(() => root.editorRef.value?.editor);
  assert(content(root) === '', 'Accounts must not share drafts');
  root.currentUser = originalUser;
  await root.updateComplete;
  await until(() => root.editorRef.value?.editor);
  assert(
    content(root) === 'root draft',
    'Switching back must restore the account draft'
  );
  const other = await mount('draft-test-post-other');
  assert(
    content(await base(other.shadowRoot.querySelector('comment-form'))) === '',
    'Articles must not share drafts'
  );
  other.remove();
  const reopenedItems = [
    ...widget.shadowRoot
      .querySelector('comment-list')
      .shadowRoot.querySelectorAll('comment-item'),
  ];
  const [, cleared] = await open(reopenedItems[0]);
  assert(content(cleared) === '', 'Submitted reply must reopen empty');
  const [, restoredB] = await open(reopenedItems[1]);
  assert(content(restoredB) === 'reply B', 'Other reply draft must survive');
  restoredB.quoteReplyName = 'quoted-reply';
  await restoredB.updateComplete;
  await until(() => restoredB.editorRef.value?.editor);
  assert(content(restoredB) === '', 'Quoted reply must have a separate draft');
  edit(restoredB, '<p>quoted draft</p>');
  restoredB.quoteReplyName = '';
  await restoredB.updateComplete;
  await until(() => restoredB.editorRef.value?.editor);
  assert(
    content(restoredB) === 'reply B',
    'Changing reply target must restore its draft'
  );
  keys()
    .filter((key) => key.includes('quoted-reply'))
    .forEach((key) => {
      localStorage.removeItem(key);
    });
  edit(restoredB, '');
  assert(keys().length === 1, 'Deleting all content must remove its draft');
  await submit(rootOwner);
  assert(
    keys().length === 0 && content(root) === '',
    'Successful root submission must clear draft and editor'
  );
  // A completed request must only clear the draft that it submitted.
  for (const target of ['comment', 'reply', 'quote']) {
    for (const changed of [false, true, 'quota']) {
      const raceWidget = await mount(
        `draft-test-post-race-${target}-${changed}`
      );
      let item = raceWidget.shadowRoot
        .querySelector('comment-list')
        .shadowRoot.querySelector('comment-item');
      if (target === 'quote') {
        item = document.createElement('reply-item');
        item.comment = comments[0];
        item.reply = {
          ...comments[0],
          metadata: { name: 'quoted-race-reply' },
        };
        raceWidget.shadowRoot.append(item);
        await item.updateComplete;
      }
      const [owner, original] =
        target === 'comment'
          ? [
              raceWidget.shadowRoot.querySelector('comment-form'),
              await base(raceWidget.shadowRoot.querySelector('comment-form')),
            ]
          : await open(item);
      edit(original, '<p>submitted draft</p>');
      delaySubmit = true;
      finishSubmit = undefined;
      const inFlight = submit(owner);
      await until(() => finishSubmit);
      let active = original;
      if (target !== 'comment') {
        item.handleToggleReplyForm();
        await until(() => !original.isConnected);
        [, active] = await open(item);
      }
      const setItem = Storage.prototype.setItem;
      if (changed === 'quota')
        Storage.prototype.setItem = () => {
          throw new Error('Quota exceeded');
        };
      try {
        if (changed) edit(active, '<p>new unsent draft</p>');
        finishSubmit();
        await inFlight;
      } finally {
        Storage.prototype.setItem = setItem;
      }
      if (changed === 'quota') {
        assert(
          active.isConnected && content(active) === 'new unsent draft',
          `${target}: failed storage must not allow old success to close new input`
        );
        edit(active, '<p>new unsent draft!</p>');
        edit(active, '<p>new unsent draft</p>');
      }
      delaySubmit = false;
      if (changed) {
        assert(
          active.isConnected && content(active) === 'new unsent draft',
          `${target}: old success must keep the active new draft`
        );
        assert(
          keys().some((key) =>
            localStorage.getItem(key).includes('new unsent draft')
          ),
          `${target}: old success must keep the stored new draft`
        );
      } else {
        assert(
          !keys().some((key) => key.includes(`race-${target}-${changed}`)),
          `${target}: unchanged submitted draft must be removed`
        );
      }
      raceWidget.remove();
      const remounted = await mount(
        `draft-test-post-race-${target}-${changed}`
      );
      if (target === 'comment') {
        const restored = await base(
          remounted.shadowRoot.querySelector('comment-form')
        );
        assert(
          content(restored) === (changed ? 'new unsent draft' : ''),
          `${target}: remount must reflect the remaining draft`
        );
      }
      remounted.remove();
      keys()
        .filter((key) => key.includes(`race-${target}-${changed}`))
        .forEach((key) => {
          localStorage.removeItem(key);
        });
    }
  }
  const draftKey = keys()[0] ?? root.draftKey;
  localStorage.setItem(draftKey, '{invalid json');
  widget.remove();
  widget = await mount();
  root = await base(widget.shadowRoot.querySelector('comment-form'));
  assert(content(root) === '', 'Malformed storage must not break editing');
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = () => {
    throw new Error('Storage unavailable');
  };
  try {
    edit(root, '<p>still editable</p>');
    assert(
      content(root) === 'still editable',
      'Storage failures must not break editing'
    );
  } finally {
    Storage.prototype.setItem = originalSetItem;
  }
  widget.remove();
});
