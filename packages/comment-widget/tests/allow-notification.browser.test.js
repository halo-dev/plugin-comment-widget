import { assert, test } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test.each(['comment-form', 'reply-form'])(
  '%s submits the selected allow notification state',
  async (tag) => {
    const requests = [];
    mockApi(async (_input, options = {}) => {
      requests.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ spec: { approved: true } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    });
    await import('../src/index.ts');

    const form = document.createElement(tag);
    form.comment = { metadata: { name: 'comment-1' } };
    form.currentUser = { metadata: { name: 'commenter' }, spec: {} };
    document.body.append(form);
    await form.updateComplete;
    const base = form.baseFormRef.value;
    base.currentUser = form.currentUser;
    await base.updateComplete;
    await until(() => base.editorRef.value?.editor);

    const checkbox = base.shadowRoot.querySelector('#allowNotification');
    assert(checkbox, 'Allow notification must be selectable');
    assert(checkbox.checked, 'Allow notification must be enabled by default');

    base.editorRef.value.editor.commands.setContent('<p>Notify me</p>');
    base.shadowRoot.querySelector('form').requestSubmit();
    await until(() => requests.length === 1 && !form.submitting);
    assert(
      requests[0].allowNotification === true,
      'Checked must send allowNotification=true'
    );

    checkbox.click();
    assert(!checkbox.checked, 'Allow notification must be toggleable');
    base.editorRef.value.editor.commands.setContent('<p>Do not notify me</p>');
    base.shadowRoot.querySelector('form').requestSubmit();
    await until(() => requests.length === 2 && !form.submitting);
    assert(
      requests[1].allowNotification === false,
      'Unchecked must send allowNotification=false'
    );
    form.remove();
  }
);
