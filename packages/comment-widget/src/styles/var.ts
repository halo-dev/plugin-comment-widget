import { css } from 'lit';

const varStyles = css`
  :host {
    /* Base */
    --base-border-radius: var(--halo-comment-widget-base-border-radius, 0.4rem);
    --base-font-size: var(--halo-comment-widget-base-font-size, 0.875rem);
    --base-line-height: var(--halo-comment-widget-base-line-height, 1.25rem);
    --base-font-family: var(
      --halo-comment-widget-base-font-family,
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

    /* Components */
    --component-avatar-rounded: var(--halo-comment-widget-component-avatar-rounded, 9999px);
    --component-avatar-size: var(--halo-comment-widget-component-avatar-size, 2rem);
    --component-form-input-bg-color: var(--halo-comment-widget-component-form-input-bg-color, #fff);
    --component-form-input-color: var(--halo-comment-widget-component-form-input-color, #3b4351);
    --component-form-input-border-color: var(
      --halo-comment-widget-component-form-input-border-color,
      #bcc3ce
    );
    --component-form-input-border-color-focus: var(
      --halo-comment-widget-component-form-input-border-color-focus,
      #5755d9
    );
    --component-form-input-box-shadow-focus: var(
      --halo-comment-widget-component-form-input-box-shadow-focus,
      0 0 0 0.15rem rgba(87, 85, 217, 0.2)
    );

    --component-form-button-login-bg-color: var(
      --halo-comment-widget-component-form-button-login-bg-color,
      #fff
    );
    --component-form-button-login-bg-color-hover: var(
      --halo-comment-widget-component-form-button-login-bg-color-hover,
      #f2f4f8
    );
    --component-form-button-login-border-color: var(
      --halo-comment-widget-component-form-button-login-border-color,
      #f2f4f8
    );
    --component-form-button-submit-bg-color: var(
      --halo-comment-widget-component-form-button-submit-bg-color,
      #0d1731
    );
    --component-form-button-submit-color: var(
      --halo-comment-widget-component-form-button-submit-color,
      #fff
    );
    --component-form-button-submit-border-color: var(
      --halo-comment-widget-component-form-button-submit-border-color,
      #0d1731
    );
    --component-form-button-submit-border-color-hover: var(
      --halo-comment-widget-component-form-button-submit-border-color-hover,
      #0d1731
    );
    --component-form-button-emoji-color: var(
      --halo-comment-widget-component-form-button-emoji-color,
      #4b5563
    );

    --component-comment-item-action-bg-color-hover: var(
      --halo-comment-widget-component-comment-item-action-bg-color-hover,
      #f3f4f6
    );
    --component-comment-item-action-color: var(
      --halo-comment-widget-component-comment-item-action-color,
      #4b5563
    );
    --component-comment-item-action-color-hover: var(
      --halo-comment-widget-component-comment-item-action-color-hover,
      #333
    );

    --component-pagination-button-bg-color-hover: var(
      --halo-comment-widget-component-pagination-button-bg-color-hover,
      #f5f5f5
    );
    --component-pagination-button-bg-color-active: var(
      --halo-comment-widget-component-pagination-button-bg-color-active,
      #fff
    );
    --component-pagination-button-border-color-active: var(
      --halo-comment-widget-component-pagination-button-border-color-active,
      #d1d5db
    );
  }
`;

export default varStyles;
