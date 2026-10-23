import { CommentWidget } from '@halo-dev/comment-widget';
import '@halo-dev/comment-widget/var.css';

export { CommentWidget };

interface Props {
  group: string;
  kind: string;
  name: string;
}

export function init(el: string, props: Props) {
  const parent = document.querySelector(el) as HTMLElement;

  if (!parent) {
    console.error('Element not found', el);
    return;
  }

  const commentWidget = document.createElement(
    'comment-widget'
  ) as CommentWidget;

  commentWidget.kind = props.kind;
  commentWidget.group = props.group;
  commentWidget.version = 'v1alpha1';
  commentWidget.name = props.name;

  const mount = () => {
    if (parent.childElementCount !== 0) return;

    parent.appendChild(commentWidget);
    observer.disconnect();

    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      parent.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 300,
        fill: 'forwards',
      });
    }
  };

  const showTarget = () => {
    if (!parent.isConnected) {
      targetObserver.disconnect();
      return;
    }
    if (!parent.getClientRects().length) return;
    targetObserver.disconnect();
    mount();
    if (location.hash === '#halo-comment') {
      parent.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  };
  const targetObserver = new ResizeObserver(showTarget);

  let previousHash: string | undefined;
  const onLocationChange = () => {
    if (!parent.isConnected) {
      observer.disconnect();
      targetObserver.disconnect();
      window.removeEventListener('hashchange', onLocationChange);
      window.removeEventListener('popstate', onLocationChange);
      return;
    }
    const hash = location.hash;
    if (hash === previousHash) return;
    previousHash = hash;
    targetObserver.disconnect();
    const isCommentAnchor = hash === '#halo-comment';
    if (
      isCommentAnchor ||
      new URLSearchParams(hash.slice(1)).get('halo-comment')
    ) {
      if (isCommentAnchor) mount();
      targetObserver.observe(parent);
      showTarget();
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) mount();
    });
  });
  observer.observe(parent as Element);
  window.addEventListener('hashchange', onLocationChange);
  window.addEventListener('popstate', onLocationChange);
  onLocationChange();
}
