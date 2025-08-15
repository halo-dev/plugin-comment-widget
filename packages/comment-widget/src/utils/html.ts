import sanitizeHtml from 'sanitize-html';
export function cleanHtml(content?: string) {
  if (!content) {
    return '';
  }

  return sanitizeHtml(content, {
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
    },
  });
}
