import { ContextProvider } from '@lit/context';
import { assert, test } from 'vitest';
import { canManageCommentsContext, configMapDataContext } from '../src/context';
import '../src/base-comment-item';

test('Private badges respect visitor settings and always appear for managers', async () => {
  for (const showPrivateCommentBadge of [false, true, undefined]) {
    const host = document.createElement('div');
    new ContextProvider(host, {
      context: configMapDataContext,
      initialValue: { basic: { showPrivateCommentBadge } },
    });
    const permission = new ContextProvider(host, {
      context: canManageCommentsContext,
      initialValue: false,
    });
    document.body.append(host);
    const item = document.createElement('base-comment-item');
    host.append(item);

    for (const canManage of [false, true, false]) {
      permission.setValue(canManage);
      for (const isPrivate of [true, false]) {
        item.private = isPrivate;
        await item.updateComplete;
        assert.equal(
          !!item.shadowRoot.querySelector('.i-ri-git-repository-private-line'),
          isPrivate && (canManage || !!showPrivateCommentBadge),
          `private=${isPrivate}, manager=${canManage}, setting=${showPrivateCommentBadge}`
        );
      }
    }
    host.remove();
  }
});
