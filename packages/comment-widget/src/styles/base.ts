import resetStyles from '@unocss/reset/tailwind.css?inline';
import { css, unsafeCSS } from 'lit';
import varStyles from './var';

const baseStyles = [
  varStyles,
  unsafeCSS(resetStyles),
  css`
    :host {
      font-size: var(--base-font-size);
      font-family: var(--base-font-family);
    }
  `,
];

export default baseStyles;
