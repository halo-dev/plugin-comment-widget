import {
  defineConfig,
  definePreset,
  presetIcons,
  presetWind3,
  transformerDirectives,
} from 'unocss';

const remRE = /(-?[.\d]+)rem/g;

const presetRemToEm = definePreset(() => {
  return {
    name: '@unocss/preset-rem-to-em',
    postprocess: (util) => {
      util.entries.forEach((i) => {
        const value = i[1];
        if (typeof value === 'string' && remRE.test(value))
          i[1] = value.replace(remRE, (_, p1) => `${p1}em`);
      });
    },
  };
});

export default defineConfig({
  presets: [presetWind3(), presetIcons(), presetRemToEm()],
  theme: {
    colors: {
      primary: {
        1: 'var(--halo-cw-primary-1-color, #4CCBA0)',
        2: 'var(--halo-cw-primary-2-color, #6EE7B7)',
        3: 'var(--halo-cw-primary-3-color, #99F6E4)',
      },
      background: 'var(--halo-cw-background-color, transparent)',
      text: {
        1: 'var(--halo-cw-text-1-color, #0f172a)',
        2: 'var(--halo-cw-text-2-color, #1e293b)',
        3: 'var(--halo-cw-text-3-color, #475569)',
      },
      muted: {
        1: 'var(--halo-cw-muted-1-color, #cbd5e1)',
        2: 'var(--halo-cw-muted-2-color, #e2e8f0)',
        3: 'var(--halo-cw-muted-3-color, #f1f5f9)',
      },
    },
    borderRadius: {
      base: 'var(--halo-cw-base-rounded, 0.5em)',
    },
  },
  rules: [
    [
      'shadow-input',
      {
        'box-shadow': '0 0 0 3px var(--halo-cw-primary-3-color, #99F6E4)',
      },
    ],
  ],
  shortcuts: {
    input:
      'px-3 py-0 text-sm rounded-base bg-transparent border h-12 border-muted-1 border-solid outline-none transition-all focus:border-primary-1 focus:shadow-input placeholder:text-text-3',
    'icon-button': 'inline-flex items-center gap-[0.1em] cursor-pointer',
    'icon-button-icon':
      'inline-flex items-center justify-center rounded-full transition-all duration-150 p-2 text-text-3 group-hover:bg-muted-3 group-hover:text-text-1',
    'icon-button-text':
      'select-none text-xs text-text-3 group-hover:text-text-1',
    'pagination-button':
      'inline-flex h-10 items-center text-sm gap-1 hover:bg-muted-3 rounded-base px-3 transition-all text-text-1 opacity-80 disabled:!opacity-70 disabled:cursor-not-allowed hover:opacity-100 font-medium justify-center',
    avatar:
      'rounded-full size-9 overflow-hidden inline-flex items-center justify-center bg-muted-2',
  },
  transformers: [transformerDirectives()],
});
