export interface NextReplyRequestOptions {
  page: number;
  currentPageSize: number;
  replySize: number;
  preloaded: boolean;
}

export interface NextReplyRequest {
  page: number;
  size: number;
  append: boolean;
}

export function getInitialReplySize(
  withReplySize: number,
  replySize: number
): number {
  return Math.min(Math.max(1, withReplySize), Math.max(1, replySize));
}

export function getNextReplyRequest({
  page,
  currentPageSize,
  replySize,
  preloaded,
}: NextReplyRequestOptions): NextReplyRequest {
  if (preloaded && currentPageSize < replySize) {
    return {
      page,
      size: replySize,
      append: false,
    };
  }

  return {
    page: page + 1,
    size: replySize,
    append: true,
  };
}
