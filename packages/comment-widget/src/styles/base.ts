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
  `,
];

export default baseStyles;
