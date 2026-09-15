import assert from 'node:assert/strict';
import { test } from 'vitest';
import { toEditorContent } from '../src/utils/html.ts';

test('toEditorContent keeps HTML raw unchanged', () => {
  const html = '<p>first</p><p>second&nbsp;&nbsp;line</p>';
  assert.equal(toEditorContent(html), html);
});

test('toEditorContent converts plain text lines to hard breaks without losing whitespace', () => {
  assert.equal(
    toEditorContent('first line\nsecond  line'),
    'first line<br>second\u00a0 line'
  );
});

test('toEditorContent preserves blank lines and edge spaces', () => {
  assert.equal(
    toEditorContent(' leading\n\ntrailing '),
    '\u00a0leading<br><br>trailing\u00a0'
  );
});

test('toEditorContent escapes plain text that looks like markup', () => {
  assert.equal(toEditorContent('1 < 2 & 3 > 2'), '1 &lt; 2 &amp; 3 &gt; 2');
});

test('toEditorContent keeps existing entities encoded once', () => {
  assert.equal(
    toEditorContent('A &lt; B &amp; C &#65;'),
    'A &lt; B &amp; C &#65;'
  );
});

test('toEditorContent normalizes CRLF line endings', () => {
  assert.equal(toEditorContent('a\r\nb\rc'), 'a<br>b<br>c');
});

test('toEditorContent expands tabs to preserved spaces', () => {
  assert.equal(toEditorContent('a\tb'), 'a\u00a0\u00a0\u00a0\u00a0b');
});

test('toEditorContent escapes angle-bracket text that cleaning would strip', () => {
  assert.equal(
    toEditorContent('see <https://x.com>'),
    'see &lt;https://x.com&gt;'
  );
});

test('toEditorContent keeps in-prose tags that survive cleaning as HTML', () => {
  assert.equal(toEditorContent('use the <p> tag'), 'use the <p> tag');
});
