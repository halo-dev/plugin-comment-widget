import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bundledLanguages,
  bundledThemes,
  codeToHtml,
  createHighlighter,
} from '../src/shiki-bundle.ts';

test('highlights code with the JavaScript regex engine', async () => {
  const html = await codeToHtml('const answer = 42;', {
    lang: 'javascript',
    theme: 'github-dark',
  });

  assert.match(html, /<pre class="shiki github-dark"/);
  assert.match(html, /<span style="color:/);
});

test('provides the API used by the Tiptap Shiki extension', async () => {
  assert.ok('javascript' in bundledLanguages);
  assert.ok('github-dark' in bundledThemes);

  const highlighter = await createHighlighter({
    langs: ['javascript'],
    themes: ['github-dark'],
  });

  assert.match(
    highlighter.codeToHtml('const answer = 42;', {
      lang: 'javascript',
      theme: 'github-dark',
    }),
    /<span style="color:/
  );
  highlighter.dispose();
});
