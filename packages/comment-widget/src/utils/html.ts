import sanitizeHtml from 'sanitize-html';
export function cleanHtml(content?: string) {
  if (!content) {
    return '';
  }

  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
    },
  });
}
