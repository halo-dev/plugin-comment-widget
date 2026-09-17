import { msg } from '@lit/localize';
import type { UploadSession } from './upload-session';

/** Contract between BaseForm and the comment/reply request handlers. */
export interface SubmissionDetail {
  displayName?: string;
  email?: string;
  website?: string;
  captchaCode?: string;
  turnstileToken?: string;
  altchaPayload?: string;
  content: string;
  hidden: boolean;
  uploadIds: string[];
  uploadSession: UploadSession;
  waitUntil: (submission: Promise<unknown>) => void;
}

export type SubmissionEvent = CustomEvent<SubmissionDetail>;

export function isPendingReview(
  resource: { spec: { approved?: boolean } } | undefined
) {
  if (!resource) {
    return false;
  }
  return !resource.spec.approved;
}

export function submissionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return msg('Comment failed, please try again later');
}
