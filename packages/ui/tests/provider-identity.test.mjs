import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { defineAsyncComponent, markRaw } from 'vue';

// Load the real entry point without the Halo host or browser-only UI imports.
const dependencies = {
  '@halo-dev/components': { VLoading: {} },
  '@halo-dev/ui-shared': { definePlugin: (plugin) => plugin },
  vue: { defineAsyncComponent, markRaw },
};
const entry = new SourceTextModule(
  await readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
);
await entry.link((specifier) => {
  const exports = dependencies[specifier];
  return new SyntheticModule(Object.keys(exports), function () {
    for (const [name, value] of Object.entries(exports)) {
      this.setExport(name, value);
    }
  });
});
await entry.evaluate();

for (const name of [
  'comment:list-item:content:replace',
  'comment:editor:replace',
]) {
  test(`${name} keeps the component identity on repeated queries`, async () => {
    const provider = entry.namespace.default.extensionPoints[name];
    const first = await provider();
    const next = await provider();
    assert.equal(next.component, first.component);
  });
}
