import assert from 'node:assert/strict';
import { test } from 'vitest';
import { toEditorContent } from '../src/utils/html.ts';

test('toEditorContent keeps HTML raw unchanged', () => {
  const html = '<p>first</p><p>second&nbsp;&nbsp;line</p>';
  assert.equal(toEditorContent(html), html);
});

test('toEditorContent converts plain text to paragraphs without losing whitespace', () => {
  assert.equal(
    toEditorContent('first line\nsecond  line'),
    '<p>first line</p><p>second\u00a0 line</p>'
  );
});

test('toEditorContent preserves blank lines and edge spaces', () => {
  assert.equal(
    toEditorContent(' leading\n\ntrailing '),
    '<p>\u00a0leading</p><p></p><p>trailing\u00a0</p>'
  );
});

test('toEditorContent escapes plain text that looks like markup', () => {
  assert.equal(
    toEditorContent('1 < 2 & 3 > 2'),
    '<p>1 &lt; 2 &amp; 3 &gt; 2</p>'
  );
});
