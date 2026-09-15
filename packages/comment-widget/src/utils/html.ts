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

const htmlTagPattern = /<\/?[a-zA-Z][^>]*>/;

// Console's plain-text editor stores raw text without markup. Tiptap parses
// initial content as HTML and would collapse newlines and consecutive spaces,
// so plain text is converted to paragraphs with preserved whitespace first.
export function toEditorContent(raw: string) {
  if (htmlTagPattern.test(raw)) {
    return raw;
  }
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map(
      (line) =>
        `<p>${line
          .replace(/ {2,}/g, (run) =>
            run
              .split('')
              .map((char, index) => (index % 2 ? char : '\u00a0'))
              .join('')
          )
          .replace(/^ | $/g, '\u00a0')}</p>`
    )
    .join('');
}
