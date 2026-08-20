import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getInitialReplySize,
  getNextReplyRequest,
} from '../src/utils/reply-pagination.ts';

test('uses withReplySize for the initial replies request', () => {
  assert.equal(getInitialReplySize(2, 4), 2);
});

test('fills the first page when fewer replies were preloaded', () => {
  assert.deepEqual(
    getNextReplyRequest({
      page: 1,
      currentPageSize: 2,
      replySize: 4,
      preloaded: true,
    }),
    { page: 1, size: 4, append: false }
  );
});

test('loads page two when a full first page was preloaded', () => {
  assert.deepEqual(
    getNextReplyRequest({
      page: 1,
      currentPageSize: 4,
      replySize: 4,
      preloaded: true,
    }),
    { page: 2, size: 4, append: true }
  );
});

test('continues with the next page after the preload is reconciled', () => {
  assert.deepEqual(
    getNextReplyRequest({
      page: 2,
      currentPageSize: 4,
      replySize: 4,
      preloaded: false,
    }),
    { page: 3, size: 4, append: true }
  );
});

test('clamps legacy preload sizes to the reply page size', () => {
  assert.equal(getInitialReplySize(5, 3), 3);
});
