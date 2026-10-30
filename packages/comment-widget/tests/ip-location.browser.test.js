import { ContextProvider } from '@lit/context';
import { expect, test } from 'vitest';
import { configMapDataContext } from '../src/context';
import '../src/comment-item';
import '../src/reply-item';

const locationKey = 'commentwidget.halo.run/ip-location';

function target(name, ipLocation) {
  return {
    metadata: {
      name,
      annotations: ipLocation ? { [locationKey]: ipLocation } : {},
    },
    spec: {
      owner: { kind: 'Email', annotations: {} },
      content: '<p>A comment</p>',
      approved: true,
      creationTime: '2026-10-30T00:00:00Z',
      // Even privileged callers must never display an IP as a location fallback.
      ipAddress: '1.0.1.1',
    },
    owner: { displayName: 'Reader' },
    stats: { upvote: 0 },
    status: { visibleReplyCount: 0 },
  };
}

async function mount(tag, showIpLocation, ipLocation) {
  const host = document.createElement('div');
  new ContextProvider(host, {
    context: configMapDataContext,
    initialValue: { basic: { showIpLocation } },
  });
  const item = document.createElement(tag);
  item.comment = target('comment', ipLocation);
  if (tag === 'reply-item') item.reply = target('reply', ipLocation);
  host.append(item);
  document.body.append(host);
  await item.updateComplete;
  const base = item.shadowRoot.querySelector('base-comment-item');
  await base.updateComplete;
  return { host, item, base };
}

for (const tag of ['comment-item', 'reply-item']) {
  test(`${tag} displays location or unknown only when enabled`, async () => {
    for (const enabled of [true, false, undefined]) {
      for (const location of ['浙江省', '', undefined]) {
        const { host, base } = await mount(tag, enabled, location);
        const badge = base.shadowRoot.querySelector('.item-ip-location');
        expect(!!badge).toBe(!!enabled);
        if (badge) expect(badge.textContent).toContain(location || 'Unknown');
        expect(base.shadowRoot.textContent).not.toContain('1.0.1.1');
        host.remove();
      }
    }
  });

  test(`${tag} renders annotations as text and reacts to refreshed data`, async () => {
    const { item, base } = await mount(
      tag,
      true,
      '<img src=x onerror=alert(1)>'
    );
    const badge = base.shadowRoot.querySelector('.item-ip-location');
    expect(badge.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(badge.querySelector('img')).toBeNull();

    const property = tag === 'reply-item' ? 'reply' : 'comment';
    item[property] = target(property, undefined);
    await item.updateComplete;
    await base.updateComplete;
    expect(
      base.shadowRoot.querySelector('.item-ip-location').textContent
    ).toContain('Unknown');
  });
}
