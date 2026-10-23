import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRslib } from '@rslib/core';
import config from '../rslib.config.mjs';

test('keeps a small entry and invalidates changed chunks', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'comment-widget-hash-'));
  try {
    await writeFile(
      join(directory, 'index.js'),
      "export { value } from './shared.js'; export const load = () => import('./lazy.js');"
    );
    await writeFile(
      join(directory, 'lazy.js'),
      "import { value } from './shared.js'; export const getValue = () => value;"
    );
    const outputs = [];
    for (const value of ['before', 'after']) {
      await writeFile(
        join(directory, 'shared.js'),
        `export let value = '${value}';`
      );
      const output = join(directory, value);
      const rslib = await createRslib({
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        config: {
          ...config,
          source: { entry: { index: join(directory, 'index.js') } },
          output: { ...config.output, distPath: { root: output } },
          tools: { rspack: { ...config.tools?.rspack, cache: false } },
        },
      });
      const result = await rslib.build();
      await result.close();
      const files = new Map();
      for (const name of await readdir(output)) {
        if (name.endsWith('.js')) {
          files.set(name, await readFile(join(output, name), 'utf8'));
        }
      }
      assert.ok(
        [...files.keys()].some((name) => /\.[a-f0-9]{8}\.js$/.test(name)),
        'fixture must emit hashed chunks'
      );
      assert.ok(
        files.get('comment-widget.js').length < 200,
        'entry must remain a small re-export'
      );
      outputs.push(files);
    }
    assert.notDeepEqual(
      outputs[0],
      outputs[1],
      'fixture must change the output'
    );
    for (const [name, content] of outputs[0]) {
      if (/\.[a-f0-9]{8}\.js$/.test(name) && outputs[1].has(name)) {
        assert.equal(
          outputs[1].get(name),
          content,
          `${name} changed without a new hash`
        );
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
