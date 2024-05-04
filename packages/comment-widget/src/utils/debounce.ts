export function debounce(func: Function, delay: number, immediate: boolean = false): Function {
  let timer: number | undefined;

  return function (this: unknown, ...args: never[]) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    if (immediate) {
      func.apply(context, args);
      immediate = false;
      return;
    }
    clearTimeout(timer);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    timer = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
