export function clearChildren(el: HTMLElement | null): void {
  if (!el) {
    return;
  }
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
