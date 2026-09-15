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

const entityPattern = /&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g;

// Console's plain-text editor stores raw text without markup, displayed with
// `white-space: pre-wrap`. Tiptap parses initial content as HTML and would
// collapse newlines and consecutive spaces, so plain text is converted to
// hard breaks with preserved whitespace first, matching that rendering.
export function toEditorContent(raw: string) {
  // Angle-bracket text that the sanitizer would strip (e.g. `<https://a.b>`)
  // is treated as plain text; only markup that survives display cleaning is
  // parsed as HTML, matching what the comment actually renders as.
  if (htmlTagPattern.test(cleanHtml(raw))) {
    return raw;
  }
  return raw
    .replace(entityPattern, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '\u00a0\u00a0\u00a0\u00a0')
    .split('\n')
    .map((line) =>
      line
        .replace(/ {2,}/g, (run) =>
          run
            .split('')
            .map((char, index) => (index % 2 ? char : '\u00a0'))
            .join('')
        )
        .replace(/^ | $/g, '\u00a0')
    )
    .join('<br>');
}
