import { defineConfig, presetIcons, presetWind3 } from 'unocss';
export default defineConfig({
  presets: [presetWind3(), presetIcons()],
  theme: {},
  shortcuts: {
    input:
      'px-2.5 py-0 rounded-md bg-transparent border h-10 border-gray-200 border-solid',
    'icon-button': 'inline-flex items-center gap-[0.1em] cursor-pointer',
    'icon-button-icon':
      'inline-flex items-center justify-center rounded-full transition-all duration-150 p-2 group-hover:bg-[var(--component-comment-item-action-bg-color-hover)]',
    'icon-button-text':
      'select-none text-xs text-[var(--base-info-color)] group-hover:text-[var(--component-comment-item-action-color-hover)]',
    'pagination-button':
      'inline-flex items-center text-sm gap-1 hover:bg-gray-100 rounded-md py-1.5 px-2 transition-all text-gray-900 opacity-80 disabled:!opacity-70 disabled:cursor-not-allowed hover:opacity-100 font-medium justify-center',
    avatar:
      'rounded-full size-9 overflow-hidden inline-flex items-center justify-center bg-gray-100',
  },
});
