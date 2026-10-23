import resetStyles from '@unocss/reset/tailwind.css?inline';
import { css, unsafeCSS } from 'lit';

const baseStyles = [
  unsafeCSS(resetStyles),
  css`
    :host {
      font-size: var(--halo-cw-base-font-size, 1rem);
      font-family: var(
        --halo-cw-base-font-family,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        Segoe UI,
        Roboto,
        Helvetica Neue,
        Arial,
        Noto Sans,
        sans-serif,
        'Apple Color Emoji',
        'Segoe UI Emoji',
        Segoe UI Symbol,
        'Noto Color Emoji'
      );
    }

    :focus-visible {
      outline: 2px solid var(--halo-cw-primary-1-color, #4ccba0);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `,
];

export default baseStyles;
