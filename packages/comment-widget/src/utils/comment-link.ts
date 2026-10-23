export interface CommentTarget {
  commentName: string;
  replyName?: string;
}

export function readCommentTarget(
  url = new URL(location.href)
): CommentTarget | undefined {
  const params = new URLSearchParams(url.hash.slice(1));
  const commentName = params.get('halo-comment');
  return commentName
    ? { commentName, replyName: params.get('reply') || undefined }
    : undefined;
}

export function scrollWhenVisible(
  target: Element,
  block: ScrollLogicalPosition
) {
  const observer = new ResizeObserver(scroll);
  function scroll() {
    if (!target.isConnected) {
      observer.disconnect();
    } else if (target.getClientRects().length) {
      observer.disconnect();
      target.scrollIntoView({ block });
    }
  }
  observer.observe(target);
  scroll();
  return () => observer.disconnect();
}
