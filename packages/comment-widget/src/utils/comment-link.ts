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

export function commentLink(commentName: string, replyName?: string): string {
  const url = new URL(location.href);
  const params = new URLSearchParams({ 'halo-comment': commentName });
  if (replyName) params.set('reply', replyName);
  url.hash = params.toString();
  return url.href;
}
