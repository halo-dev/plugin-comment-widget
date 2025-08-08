import type { FetchResponse } from 'ofetch';

export const getCaptchaCodeHeader = (code: string): Record<string, string> => {
  if (!code || code.trim().length === 0) {
    return {};
  }
  return {
    'X-Captcha-Code': code,
  };
};

export interface CaptchaRequiredResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  captcha: string;
}

export const isRequireCaptcha = (
  response: FetchResponse<CaptchaRequiredResponse>
) => {
  return response.status === 403 && response.headers.get('X-Require-Captcha');
};
