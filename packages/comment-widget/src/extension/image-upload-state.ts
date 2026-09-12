import { Fragment, type Node, Slice } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';
import type { UploadedImage } from '../utils/upload-session';

type ImageAttributes = {
  src: string;
  local: boolean;
  file: File | null;
  uploadId: string | null;
  expiresAt: string | null;
};

/** Trusted associations belong to one editor session, never to pasted HTML. */
export class ImageUploadState {
  private readonly images = new Map<string, ImageAttributes>();

  rememberLocal(src: string, file: File) {
    this.images.set(src, {
      src,
      file,
      local: true,
      uploadId: null,
      expiresAt: null,
    });
  }

  rememberUploaded(localSrc: string, image: UploadedImage, file?: File | null) {
    const previous = this.images.get(localSrc);
    const attributes = {
      src: image.url,
      uploadId: image.uploadId,
      local: false,
      file: file ?? previous?.file ?? null,
      expiresAt: image.expiresAt,
    };
    for (const [src, known] of this.images) {
      if (known === previous) this.images.set(src, attributes);
    }
    this.images.set(localSrc, attributes);
    this.images.set(image.url, attributes);
  }

  /** History can restore pre-upload attributes; reuse the confirmed attachment. */
  restoreUploaded(transaction: Transaction): Transaction {
    transaction.doc.descendants((node, pos) => {
      const known = this.uploadedAttributes(node);
      if (!known) {
        return;
      }
      transaction.setNodeMarkup(pos, undefined, { ...node.attrs, ...known });
    });
    return transaction;
  }

  private uploadedAttributes(node: Node): ImageAttributes | undefined {
    if (node.type.name !== 'image') {
      return;
    }
    const known = this.images.get(node.attrs.src);
    if (
      !known?.uploadId ||
      (!node.attrs.local && node.attrs.uploadId === known.uploadId)
    ) {
      return;
    }
    return known;
  }

  restorePasted(slice: Slice): Slice {
    return new Slice(
      this.restoreFragment(slice.content),
      slice.openStart,
      slice.openEnd
    );
  }

  private restoreFragment(fragment: Fragment): Fragment {
    const nodes: Node[] = [];
    fragment.forEach((node) => {
      nodes.push(this.restoreNode(node));
    });
    return Fragment.fromArray(nodes);
  }

  private restoreNode(node: Node): Node {
    if (node.type.name !== 'image') {
      return node.copy(this.restoreFragment(node.content));
    }
    const known = this.images.get(node.attrs.src);
    return node.type.create(
      {
        ...node.attrs,
        uploadId: null,
        local: false,
        file: null,
        expiresAt: null,
        ...known,
      },
      node.content,
      node.marks
    );
  }
}
