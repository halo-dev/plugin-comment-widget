# Tests

Run from the repository root:

```sh
pnpm install
pnpm -C packages/comment-widget exec playwright install chromium
pnpm -C packages/comment-widget test
```

Vitest runs unit tests in Node and `*.browser.test.js` in headless Chromium.
Browser tests import the widget source directly; no build or manual HTTP server is required.

To run only one project:

```sh
pnpm -C packages/comment-widget test --project unit
pnpm -C packages/comment-widget test --project browser
```

On Linux CI, install browser system dependencies with
`pnpm -C packages/comment-widget exec playwright install --with-deps chromium`.
