/** Bounds automatic verification without timing out a visitor who is still interacting. */
export class VerificationWait {
  private resolve?: (token: string) => void;
  private timeout?: ReturnType<typeof setTimeout>;
  private onTimeout: () => void;

  constructor(onTimeout: () => void) {
    this.onTimeout = onTimeout;
  }

  wait(interactive: boolean): Promise<string> {
    this.finish('');
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.setInteractive(interactive);
    });
  }

  setInteractive(interactive: boolean) {
    this.clearTimeout();
    if (!this.resolve) {
      return;
    }
    if (interactive) {
      return;
    }
    this.timeout = setTimeout(() => {
      this.finish('');
      this.onTimeout();
    }, 60000);
  }

  finish(token: string) {
    this.clearTimeout();
    const resolve = this.resolve;
    this.resolve = undefined;
    resolve?.(token);
  }

  private clearTimeout() {
    clearTimeout(this.timeout);
    this.timeout = undefined;
  }
}
