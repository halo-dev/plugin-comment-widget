import type { UserPermission } from '@halo-dev/api-client';
import { ofetch } from 'ofetch';

export type ManagementAction =
  | 'approve'
  | 'unapprove'
  | 'hide'
  | 'unhide'
  | 'delete';

export async function fetchManagementPermission(baseUrl: string) {
  try {
    const data = await ofetch<UserPermission>(
      `${baseUrl}/apis/api.console.halo.run/v1alpha1/users/-/permissions`
    );
    return (
      data.uiPermissions.includes('*') ||
      data.uiPermissions.includes('system:comments:manage')
    );
  } catch {
    return false;
  }
}

export async function manageComment(
  baseUrl: string,
  resource: 'comments' | 'replies',
  name: string,
  action: ManagementAction
) {
  const url = `${baseUrl}/apis/content.halo.run/v1alpha1/${resource}/${encodeURIComponent(name)}`;
  if (action === 'delete') {
    await ofetch(url, { method: 'DELETE', retry: 0 });
    return;
  }
  const approval = action === 'approve' || action === 'unapprove';
  await ofetch(url, {
    method: 'PATCH',
    retry: 0,
    headers: { 'Content-Type': 'application/json-patch+json' },
    body: approval
      ? [
          { op: 'add', path: '/spec/approved', value: action === 'approve' },
          {
            op: 'add',
            path: '/spec/approvedTime',
            value: action === 'approve' ? new Date().toISOString() : '',
          },
        ]
      : [{ op: 'add', path: '/spec/hidden', value: action === 'hide' }],
  });
}
