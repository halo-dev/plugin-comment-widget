import type {
  Comment,
  CommentRequest,
  Reply,
  ReplyRequest,
  User,
} from '@halo-dev/api-client';
import { msg } from '@lit/localize';
import type { Ref } from 'lit/directives/ref.js';
import { FetchError, type FetchResponse } from 'ofetch';
import type { BaseForm } from '../base-form';
import type { ToastManager } from '../lit-toast';
import type { ProblemDetail } from '../types';
import {
  type CaptchaRequiredResponse,
  getAltchaHeader,
  getCaptchaCodeHeader,
  getCaptchaMessage,
  isRequireCaptcha,
} from './captcha';
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

type SubmissionForm = {
  baseUrl: string;
  baseFormRef: Ref<BaseForm>;
  currentUser: User | undefined;
  allowAnonymousComments: boolean;
  toastManager: ToastManager | undefined;
  submitting: boolean;
  captcha: string;
};

type DraftSnapshot = ReturnType<BaseForm['getDraftSnapshot']> | undefined;

export async function submitCommentOrReply(
  event: SubmissionEvent,
  form: SubmissionForm,
  target: {
    url: string;
    request: CommentRequest | ReplyRequest;
    onSuccess: (baseForm: BaseForm | undefined, draft: DraftSnapshot) => void;
  }
) {
  event.preventDefault();
  form.submitting = true;

  const data = event.detail;
  const baseForm = form.baseFormRef.value;
  const submittedDraft = baseForm?.getDraftSnapshot();
  const { displayName, email, website } = data || {};

  if (!form.currentUser && !form.allowAnonymousComments) {
    form.toastManager?.warn(msg('Please login first'));
    form.submitting = false;
    return;
  }

  if (!form.currentUser && form.allowAnonymousComments) {
    if (!displayName || !email) {
      form.toastManager?.warn(
        msg('Please log in or complete the information first')
      );
      form.submitting = false;
      return;
    }
    target.request.owner = { displayName, email, website };
  }

  try {
    const created = await data.uploadSession.submit<Comment | Reply>(
      target.url,
      target.request,
      data.uploadIds,
      {
        ...getCaptchaCodeHeader(data.captchaCode ?? '', data.turnstileToken),
        ...getAltchaHeader(data.altchaPayload),
      },
      form.baseUrl
    );

    form.baseFormRef.value?.handleFetchCaptcha();
    form.toastManager?.success(
      isPendingReview(created)
        ? msg('Comment submitted successfully, pending review')
        : msg('Comment submitted successfully')
    );
    target.onSuccess(baseForm, submittedDraft);
  } catch (error) {
    reportSubmissionError(form, error);
  } finally {
    form.baseFormRef.value?.resetVerification();
    form.submitting = false;
  }
}

function isPendingReview(
  resource: { spec: { approved?: boolean } } | undefined
) {
  if (!resource) {
    return false;
  }
  return !resource.spec.approved;
}

function reportSubmissionError(form: SubmissionForm, error: unknown) {
  if (error instanceof FetchError) {
    if (
      isRequireCaptcha(error.response as FetchResponse<CaptchaRequiredResponse>)
    ) {
      const response = error.data as CaptchaRequiredResponse;
      form.captcha = response.captcha ?? '';
      form.toastManager?.warn(getCaptchaMessage(response));
      return;
    }

    const problemDetail = error.data as unknown as ProblemDetail;
    form.toastManager?.error(
      [problemDetail?.title, problemDetail?.detail].join(' - ') ||
        msg('Comment failed, please try again later')
    );
    return;
  }
  form.toastManager?.error(submissionErrorMessage(error));
}

function submissionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return msg('Comment failed, please try again later');
}
