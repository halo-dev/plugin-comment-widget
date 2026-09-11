import { msg } from '@lit/localize';
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
  captcha?: string;
}

export const isRequireCaptcha = (
  response: FetchResponse<CaptchaRequiredResponse>
) => {
  return response.status === 403 && response.headers.get('X-Require-Captcha');
};

export function getAltchaHeader(payload?: string): Record<string, string> {
  if (!payload) {
    return {};
  }
  return { 'X-Altcha-Payload': payload };
}

export function getCaptchaMessage(response: CaptchaRequiredResponse): string {
  if (response.type === 'https://www.halo.run/probs/captcha-invalid') {
    return msg('Verification failed. Please verify again and resubmit.');
  }
  return response.detail;
}
