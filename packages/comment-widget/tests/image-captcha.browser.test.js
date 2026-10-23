import { expect, test } from 'vitest';
import '../src/base-form.ts';
import { mockApi, until } from './browser-helpers.js';

test.each(['', 'https://halo.example.test'])(
  'image captcha uses baseUrl %s for initial load and refresh',
  async (baseUrl) => {
    const requests = [];
    const captcha = 'data:image/png;base64,AA==';
    mockApi(async (input) => {
      requests.push(new URL(String(input), location.href).href);
      return new Response(captcha);
    });
    const form = document.createElement('base-form');
    form.baseUrl = baseUrl;
    form.allowAnonymousComments = true;
    form.configMapData = {
      basic: {},
      editor: { enableEmoji: false },
      captchaRequired: true,
      security: { captcha: { type: 'IMAGE' } },
    };
    document.body.append(form);
    await until(() => form.captcha === captcha);
    await form.updateComplete;
    form.shadowRoot.querySelector('.form-captcha button').click();
    await until(() => requests.length === 2);
    const expected = `${baseUrl || location.origin}/apis/api.commentwidget.halo.run/v1alpha1/captcha/-/generate`;
    expect(requests).toEqual([expected, expected]);
  }
);
