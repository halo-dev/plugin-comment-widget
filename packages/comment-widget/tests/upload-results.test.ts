import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { FileUploadResult } from '../src/utils/upload-api.ts';
import { applyUploadResults } from '../src/utils/upload-results.ts';

const image = { uploadId: 'one', url: '/one.png', expiresAt: '' };

function apply(results: FileUploadResult[]) {
  const applied: number[] = [];
  try {
    applyUploadResults(results, (index) => {
      applied.push(index);
    });
    return { applied, error: undefined };
  } catch (error) {
    return { applied, error };
  }
}

test('successful files before and after a rejection are retained', () => {
  const result = apply([
    image,
    { error: { status: 415, message: 'type rejected' } },
    image,
  ]);
  assert.deepEqual(result.applied, [0, 2]);
  assert.equal(String(result.error), 'Error: type rejected');
});

test('quota rejection does not discard the first twenty successful files', () => {
  const result = apply([
    ...Array.from({ length: 20 }, () => image),
    { error: { status: 429, message: 'draft limit' } },
  ]);
  assert.equal(result.applied.length, 20);
  assert.equal(String(result.error), 'Error: draft limit');
});

test('successful batches finish without an error', () => {
  assert.deepEqual(apply([image]), { applied: [0], error: undefined });
});
