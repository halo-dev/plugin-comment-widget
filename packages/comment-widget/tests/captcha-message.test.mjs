import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/utils/captcha.ts', import.meta.url),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
runInNewContext(compiled, {
  exports,
  require: () => ({ msg: (message) => `localized: ${message}` }),
});

test('localizes invalid verification instead of displaying the server language', () => {
  assert.equal(
    exports.getCaptchaMessage({
      type: 'https://www.halo.run/probs/captcha-invalid',
      detail: '服务器中文提示',
    }),
    'localized: Verification failed. Please verify again and resubmit.'
  );
});

test('preserves details for other errors', () => {
  assert.equal(
    exports.getCaptchaMessage({
      type: 'https://www.halo.run/probs/captcha-unavailable',
      detail: 'Provider unavailable',
    }),
    'Provider unavailable'
  );
});
