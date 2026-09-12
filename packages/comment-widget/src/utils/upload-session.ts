import { msg } from '@lit/localize';
import { ofetch } from 'ofetch';

export interface UploadedImage {
  uploadId: string;
  url: string;
  expiresAt: string;
}

type SubmissionState =
  | 'ISSUED'
  | 'PREPARING'
  | 'PROCESSING'
  | 'UNKNOWN'
  | 'BOUND'
  | 'FAILED';
interface PendingSubmission {
  id: string;
  token: string;
  fingerprint: string;
}

// Undefined means a previous submission was confirmed, without posting it again.
export type SubmittedResource<T> = T | undefined;

export interface UploadSessionSnapshot {
  token: string;
  pending?: PendingSubmission;
}

export class UploadSession {
  readonly token: string;
  private pending?: PendingSubmission;

  constructor(
    snapshot?: UploadSessionSnapshot,
    private readonly onChange: (
      previousPendingId?: string
    ) => Promise<void> = async () => {},
    private readonly onRead: () => Promise<
      UploadSessionSnapshot | undefined
    > = async () => undefined
  ) {
    this.token =
      snapshot?.token ??
      Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
    this.pending = snapshot?.pending;
  }

  snapshot(): UploadSessionSnapshot {
    return { token: this.token, pending: this.pending };
  }

  async submit<T>(
    url: string,
    body: unknown,
    ids: string[],
    headers: Record<string, string>,
    baseUrl: string
  ): Promise<SubmittedResource<T>> {
    const stored = await this.onRead();
    if (stored?.pending) {
      this.pending = stored.pending;
    }
    const fingerprint = JSON.stringify({ url, body, ids });
    if (await this.recoverSubmission(fingerprint, baseUrl)) {
      return undefined;
    }
    if (!ids.length) {
      return ofetch<T>(url, {
        method: 'POST',
        body: body as Record<string, unknown>,
        headers,
        retry: 0,
      });
    }
    const pending = await this.ensureTicket(fingerprint, baseUrl);
    return this.postManaged<T>(url, body, ids, headers, pending);
  }

  private async recoverSubmission(
    fingerprint: string,
    baseUrl: string
  ): Promise<boolean> {
    const pending = this.pending;
    if (!pending) {
      return false;
    }
    const status = await this.readStatus(pending, baseUrl);
    if (status.state === 'BOUND') {
      if (pending.fingerprint !== fingerprint) {
        this.pending = undefined;
        await this.onChange(pending.id);
      }
      this.requireMatchingContent(
        pending,
        fingerprint,
        msg(
          'Your previous comment was submitted. Save your changes before continuing.'
        )
      );
      return true;
    }
    if (status.state === 'ISSUED') {
      if (pending.fingerprint !== fingerprint) {
        // A GET alone cannot rule out a delayed POST; cancellation must win the server CAS.
        await ofetch(
          `${baseUrl}/apis/api.commentwidget.halo.run/v1alpha1/submissions/${pending.id}`,
          {
            method: 'DELETE',
            headers: { 'X-Comment-Upload-Token': pending.token },
            retry: 0,
          }
        );
        this.pending = undefined;
        await this.onChange(pending.id);
        throw new Error(
          msg(
            'Your previous submission was cancelled. Submit again to send your changes.'
          )
        );
      }
      return false;
    }
    if (status.state === 'FAILED') {
      this.pending = undefined;
      await this.onChange(pending.id);
      return false;
    }
    throw new Error(
      msg(
        'Your previous submission is being confirmed. Please retry later; your images will be kept.'
      )
    );
  }

  private requireMatchingContent(
    pending: PendingSubmission,
    fingerprint: string,
    message: string
  ) {
    if (fingerprint !== pending.fingerprint) {
      throw new Error(message);
    }
  }

  private async readStatus(pending: PendingSubmission, baseUrl: string) {
    return ofetch<{ state: SubmissionState }>(
      `${baseUrl}/apis/api.commentwidget.halo.run/v1alpha1/submissions/${pending.id}`,
      { headers: { 'X-Comment-Upload-Token': pending.token }, retry: 0 }
    ).catch((error) => {
      if ([404, 410].includes(error?.response?.status)) {
        throw new Error(
          msg(
            'Your submission ticket has expired. Check whether your comment was submitted before continuing.'
          )
        );
      }
      throw error;
    });
  }

  private async ensureTicket(
    fingerprint: string,
    baseUrl: string
  ): Promise<PendingSubmission> {
    if (this.pending) {
      await this.onChange(this.pending.id);
      return this.pending;
    }
    const ticket = await ofetch<{ id: string; expiresAt: string }>(
      `${baseUrl}/apis/api.commentwidget.halo.run/v1alpha1/submissions`,
      {
        method: 'POST',
        headers: { 'X-Comment-Upload-Token': this.token },
        retry: 0,
      }
    );
    this.pending = { id: ticket.id, token: this.token, fingerprint };
    await this.onChange();
    return this.pending;
  }

  private postManaged<T>(
    url: string,
    body: unknown,
    ids: string[],
    headers: Record<string, string>,
    pending: PendingSubmission
  ) {
    return ofetch<T>(url, {
      method: 'POST',
      body: body as Record<string, unknown>,
      retry: 0,
      headers: {
        ...headers,
        'X-Comment-Upload-Token': pending.token,
        'X-Comment-Submission': pending.id,
        'X-Comment-Uploads': ids.join(','),
      },
    }).catch(async (error) => {
      if (
        [400, 401, 403, 404, 413, 422, 429].includes(error?.response?.status)
      ) {
        this.pending = undefined;
        await this.onChange(pending.id);
      }
      throw error;
    });
  }
}
