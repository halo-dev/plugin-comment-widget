import assert from 'node:assert/strict';
import { test } from 'vitest';
import Custom from '../src/avatar/providers/custom.ts';

test('custom avatar query parameters precede and preserve URL fragments', () => {
  for (const source of [
    'https://avatar.example/image',
    'https://avatar.example/image?size=80',
    'https://avatar.example/image#face',
    'https://avatar.example/image?size=80#face',
    'https://avatar.example/image#face?variant=1',
  ]) {
    Custom.url = source;
    const result = new URL(Custom.getAvatarSrc('alice'));
    const original = new URL(source);
    assert.equal(result.searchParams.get('_avatar'), 'alice');
    assert.equal(
      result.searchParams.get('size'),
      original.searchParams.get('size')
    );
    assert.equal(result.hash, original.hash);
  }
});
