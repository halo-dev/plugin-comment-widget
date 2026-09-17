import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { afterEach, test, vi } from 'vitest';

afterEach(() => vi.useRealTimers());

const source = await readFile(
  new URL('../src/altcha-captcha.ts', import.meta.url),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    experimentalDecorators: true,
  },
}).outputText;

function createCaptcha(
  verify,
  configure = async () => {},
  locale = 'en',
  loadLanguage = () => {},
  fetchImplementation = globalThis.fetch
) {
  const widget = {
    state: 'unverified',
    getState() {
      return this.state;
    },
    reset() {
      this.state = 'unverified';
    },
    show() {
      this.shown = true;
    },
    hide() {
      this.shown = false;
    },
    configure,
    verify,
  };
  class LitElement {
    connectedCallback() {}
    isConnected = true;
    updateComplete = Promise.resolve();
    renderRoot = { querySelector: () => widget };
  }
  const exports = {};
  runInNewContext(compiled, {
    exports,
    AbortController,
    fetch: fetchImplementation,
    Date,
    Promise,
    setTimeout,
    clearTimeout,
    customElements: { get: () => true },
    require(name) {
      if (name === './locale') {
        return { getLocale: () => locale };
      }
      if (name.startsWith('altcha/i18n/')) {
        loadLanguage(name);
        return {};
      }
      if (name === 'lit') {
        return {
          LitElement,
          css: () => {},
          html: () => {},
          unsafeCSS: () => {},
        };
      }
      if (name === 'lit/decorators.js') {
        return { property: () => () => {}, state: () => () => {} };
      }
      if (name === '@lit/localize') {
        return { msg: (value) => value };
      }
      if (name === 'altcha/altcha.css?inline') {
        return { default: ':root {}' };
      }
      if (name === './styles/base') {
        return { default: [] };
      }
      return {};
    },
  });
  const captcha = new exports.AltchaCaptcha();
  captcha.challengeUrl = '/challenge';
  return captcha;
}

const success = (payload) => ({
  payload,
  challenge: { parameters: { expiresAt: Date.now() / 1000 + 300 } },
});
const flush = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

test('shares an in-flight verification and reuses its unexpired result', async () => {
  let count = 0;
  const captcha = createCaptcha(async () => {
    count++;
    return success('token');
  });
  const first = captcha.waitForToken();
  assert.equal(captcha.waitForToken(), first);
  assert.equal(await first, 'token');
  assert.equal(await captcha.waitForToken(), 'token');
  assert.equal(count, 1);
});

test('reset cancels an outstanding verification and rejects late results', async () => {
  let complete;
  const captcha = createCaptcha(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const pending = captcha.waitForToken();
  await flush();
  captcha.reset();
  assert.equal(await pending, '');
  complete(success('stale'));
  await flush();
  assert.equal(captcha.token, '');
});

test('timeouts abort work and allow a subsequent retry', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let signal;
  let calls = 0;
  const captcha = createCaptcha(({ controller }) => {
    signal = controller.signal;
    if (++calls === 1) {
      return new Promise(() => {});
    }
    return Promise.resolve(success('retry'));
  });
  const pending = captcha.waitForToken();
  await flush();
  vi.advanceTimersByTime(60000);
  assert.equal(await pending, '');
  assert.equal(signal.aborted, true);
  assert.equal(await captcha.waitForToken(), 'retry');
});

test('failed verification can retry and reset consumes a successful result', async () => {
  let calls = 0;
  const captcha = createCaptcha(async () => {
    if (++calls === 1) {
      throw new Error('offline');
    }
    return success(`token-${calls}`);
  });
  assert.equal(await captcha.waitForToken(), '');
  assert.equal(await captcha.waitForToken(), 'token-2');
  captcha.reset();
  assert.equal(await captcha.waitForToken(), 'token-3');
});

test('does not start verification after the component is detached', async () => {
  const captcha = createCaptcha(() => assert.fail('Unexpected verification'));
  captcha.isConnected = false;
  assert.equal(await captcha.waitForToken(), '');
});

test('standard only accepts manual verification, including after reset and expiry', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let options;
  const captcha = createCaptcha(
    () => assert.fail('Standard must not call verify automatically'),
    async (value) => {
      options = value;
    }
  );
  captcha.display = 'standard';
  captcha.connectedCallback();
  await flush();
  assert.equal(options.display, 'standard');
  assert.equal(options.auto, 'off');
  assert.equal(options.hideLogo, false);
  assert.equal(options.hideFooter, false);
  assert.equal(captcha.interactionRequired, true);
  const widget = captcha.renderRoot.querySelector();
  const changeState = (state, payload) => {
    widget.state = state;
    captcha.handleStateChange({ detail: { state, payload } });
  };
  let settled = false;
  const pending = captcha.waitForToken().then((token) => {
    settled = true;
    return token;
  });
  await flush();
  vi.advanceTimersByTime(60000);
  await flush();
  assert.equal(settled, false);
  changeState('verified', 'manual-token');
  assert.equal(await pending, 'manual-token');
  assert.equal(await captcha.waitForToken(), 'manual-token');
  assert.equal(captcha.interactionRequired, false);
  changeState('expired');
  assert.equal(captcha.token, '');
  const expired = captcha.waitForToken();
  await flush();
  captcha.reset();
  assert.equal(await expired, '');
  const retry = captcha.waitForToken();
  await flush();
  changeState('error');
  assert.equal(await retry, '');
  changeState('verified', 'before-submit');
  assert.equal(await captcha.waitForToken(), 'before-submit');
});

test('standard times out active requests, releases submission, and supports retry', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let options;
  const signals = [];
  const captcha = createCaptcha(
    () => assert.fail('Unexpected automatic verification'),
    async (value) => {
      options = value;
    },
    'en',
    () => {},
    async (_input, { signal }) => {
      signals.push(signal);
    }
  );
  captcha.display = 'standard';
  await captcha.loadStandardWidget();
  const pending = captcha.waitForToken();
  await flush();
  await options.fetch('/challenge');
  captcha.handleStateChange({ detail: { state: 'verifying' } });
  assert.equal(signals[0].aborted, false);
  vi.advanceTimersByTime(60000);
  assert.equal(signals[0].aborted, true);
  assert.equal(await pending, '');
  assert.equal(captcha.failed, true);
  const retry = captcha.waitForToken();
  await flush();
  await options.fetch('/challenge');
  captcha.handleStateChange({ detail: { state: 'verifying' } });
  assert.notEqual(signals[1], signals[0]);
  assert.equal(signals[1].aborted, false);
  captcha.handleStateChange({
    detail: { state: 'verified', payload: 'retry-token' },
  });
  assert.equal(await retry, 'retry-token');
  vi.advanceTimersByTime(60000);
  assert.equal(captcha.token, 'retry-token');
  assert.equal(captcha.failed, false);
  captcha.reset();
  assert.equal(signals[1].aborted, true);
});

test('keeps the widget hidden until language and challenge configuration are ready', async () => {
  const captcha = createCaptcha(() => assert.fail('Unexpected verification'));
  let release;
  captcha.loadLanguage = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const ready = captcha.configureWidget();
  await flush();
  assert.equal(captcha.ready, false);
  release('zh-cn');
  await ready;
  assert.equal(captcha.ready, true);
  assert.match(source, /\?hidden=\$\{!this\.ready\}/);
});

test('floating waits for submission and anchors verification to the submit button', async () => {
  let options;
  let calls = 0;
  const button = {};
  const captcha = createCaptcha(
    async () => {
      calls++;
      return success('token');
    },
    async (value) => {
      options = value;
    }
  );
  captcha.parentElement = {
    querySelector(selector) {
      assert.equal(selector, 'button[type="submit"]');
      return button;
    },
  };
  captcha.connectedCallback();
  await flush();
  assert.equal(calls, 0);
  assert.equal(options, undefined);
  assert.equal(await captcha.waitForToken(), 'token');
  assert.equal(calls, 1);
  assert.equal(options.display, 'floating');
  assert.equal(options.floatingAnchor, button);
  assert.equal(captcha.renderRoot.querySelector().shown, true);
  assert.equal(options.type, 'switch');
  captcha.reset();
  assert.equal(captcha.renderRoot.querySelector().shown, false);
});

test('passes independent logo and footer settings in both display modes', async () => {
  for (const display of ['standard', 'floating']) {
    for (const [hideLogo, hideFooter] of [
      [true, false],
      [false, true],
      [true, true],
    ]) {
      let options;
      const captcha = createCaptcha(
        async () => success('token'),
        async (value) => {
          options = value;
        }
      );
      Object.assign(captcha, { display, hideLogo, hideFooter });
      await captcha.configureWidget();
      assert.equal(options.hideLogo, hideLogo);
      assert.equal(options.hideFooter, hideFooter);
    }
  }
});

for (const [locale, language] of [
  ['en', 'en'],
  ['zh-CN', 'zh-cn'],
  ['zh-TW', 'zh-tw'],
  ['es', 'es-es'],
]) {
  test(`loads only the language pack for ${locale}`, async () => {
    let options;
    const imports = [];
    const captcha = createCaptcha(
      async () => success('token'),
      async (value) => {
        options = value;
      },
      locale,
      (name) => imports.push(name)
    );
    assert.equal(await captcha.waitForToken(), 'token');
    assert.equal(options.language, language);
    if (language === 'en') {
      assert.deepEqual(imports, []);
      return;
    }
    assert.deepEqual(imports, [`altcha/i18n/${language}`]);
  });
}

test('falls back to bundled English when a language pack fails', async () => {
  let options;
  const captcha = createCaptcha(
    async () => success('token'),
    async (value) => {
      options = value;
    },
    'zh-CN',
    () => {
      throw new Error('offline');
    }
  );
  assert.equal(await captcha.waitForToken(), 'token');
  assert.equal(options.language, 'en');
});
