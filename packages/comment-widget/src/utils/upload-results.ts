import { msg } from '@lit/localize';
import type { FileUploadResult } from './upload-api';
import type { UploadedImage } from './upload-session';

/** Persist every successful result before reporting any rejected files. */
export function applyUploadResults(
  results: FileUploadResult[],
  onUploaded: (index: number, image: UploadedImage) => void
) {
  const errors = new Set<string>();
  for (const [index, result] of results.entries()) {
    if ('error' in result) {
      errors.add(result.error.message || msg('Upload failed. Please retry.'));
      continue;
    }
    onUploaded(index, result);
  }
  if (errors.size > 0) {
    throw new Error([...errors].join('; '));
  }
}
