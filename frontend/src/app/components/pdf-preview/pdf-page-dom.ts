export interface PdfPageDom {
  pageEl: HTMLDivElement;
  canvas: HTMLCanvasElement;
  textLayerDiv: HTMLDivElement;
}

export function createPdfPageDom(
  pageNumber: number,
  viewport: { width: number; height: number },
): PdfPageDom {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const scaledWidth = Math.floor(viewport.width);
  const scaledHeight = Math.floor(viewport.height);

  const pageEl = document.createElement("div");
  pageEl.className = "pdf-page";
  pageEl.setAttribute("data-page-number", String(pageNumber));
  pageEl.style.width = scaledWidth + "px";
  pageEl.style.height = scaledHeight + "px";

  const canvas = document.createElement("canvas");
  canvas.className = "pdf-page__canvas";
  canvas.width = Math.floor(scaledWidth * devicePixelRatio);
  canvas.height = Math.floor(scaledHeight * devicePixelRatio);
  canvas.style.width = scaledWidth + "px";
  canvas.style.height = scaledHeight + "px";

  const textLayerDiv = document.createElement("div");
  textLayerDiv.className = "textLayer";
  textLayerDiv.style.width = scaledWidth + "px";
  textLayerDiv.style.height = scaledHeight + "px";

  pageEl.appendChild(canvas);
  pageEl.appendChild(textLayerDiv);

  return { pageEl, canvas, textLayerDiv };
}

export function hiDpiTransform(): number[] | null {
  const dpr = window.devicePixelRatio || 1;
  return dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;
}

export function clearChildren(el: HTMLElement | null | undefined): void {
  if (!el) {
    return;
  }
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
