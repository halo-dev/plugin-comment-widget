import assert from 'node:assert/strict';
import { afterEach, test, vi } from 'vitest';
import { VerificationWait } from '../src/utils/verification-wait.ts';

afterEach(() => vi.useRealTimers());

test('allows manual interaction beyond the automatic timeout and resolves after success', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let timedOut = false;
  const wait = new VerificationWait(() => {
    timedOut = true;
  });
  const result = wait.wait(false);
  vi.advanceTimersByTime(59000);
  wait.setInteractive(true);
  vi.advanceTimersByTime(120000);
  assert.equal(timedOut, false);
  wait.finish('verified');
  assert.equal(await result, 'verified');
});

test('starts a fresh bounded wait when manual interaction ends', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let timedOut = false;
  const wait = new VerificationWait(() => {
    timedOut = true;
  });
  const result = wait.wait(true);
  vi.advanceTimersByTime(120000);
  assert.equal(timedOut, false);
  wait.setInteractive(false);
  vi.advanceTimersByTime(60000);
  assert.equal(await result, '');
  assert.equal(timedOut, true);
});

test('cancellation clears pending timers and prevents late timeout callbacks', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const wait = new VerificationWait(() => assert.fail('Unexpected timeout'));
  const result = wait.wait(false);
  wait.finish('');
  assert.equal(await result, '');
  vi.advanceTimersByTime(120000);
});
