import { msg } from '@lit/localize';
import { ofetch } from 'ofetch';
import type { UploadedImage, UploadSession } from './upload-session';

export type FileUploadResult =
  | UploadedImage
  | { error: { status: number; message: string } };

type ErrorResponse = {
  title?: string;
  detail?: string;
  status?: number;
  instance?: string;
  requestId?: string;
  timestamp?: string;
  type?: string;
};

export async function uploadFiles(
  files: File[],
  session: UploadSession,
  baseUrl?: string
): Promise<FileUploadResult[]> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const attachments = await ofetch(
      `${baseUrl ?? ''}/apis/api.commentwidget.halo.run/v1alpha1/upload`,
      {
        method: 'POST',
        retry: 0,
        headers: { 'X-Comment-Upload-Token': session.token },
        body: formData,
      }
    );

    return attachments;
  } catch (error: unknown) {
    if (hasErrorData(error)) {
      const errorData = (error as { data: ErrorResponse }).data;
      const title = errorData?.title || msg('Upload failed');
      const detail = errorData?.detail || '';
      const message = uploadErrorMessage(title, detail);
      throw new Error(message);
    }
    throw new Error(msg('Upload failed'));
  }
}

function hasErrorData(error: unknown): error is { data: ErrorResponse } {
  if (!error) {
    return false;
  }
  if (typeof error !== 'object') {
    return false;
  }
  return 'data' in error;
}

function uploadErrorMessage(title: string, detail: string) {
  if (detail) {
    return `${title}: ${detail}`;
  }
  return title;
}
