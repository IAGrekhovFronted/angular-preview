/**
 * DOM-элементы, необходимые для отображения одной страницы PDF.
 */
export interface PdfPageDom {
  pageEl: HTMLDivElement;
  canvasEl: HTMLCanvasElement;
  textLayerEl: HTMLDivElement;
}

/**
 * Создает DOM-структуру страницы PDF: контейнер страницы, canvas для растра
 * и текстовый слой для выделения/поиска текста.
 */
export function createPdfPageDom(
  pageNumber: number,
  viewport: { width: number; height: number },
): PdfPageDom {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const scaledWidth = Math.floor(viewport.width);
  const scaledHeight = Math.floor(viewport.height);
  const cssWidth = `${scaledWidth}px`;
  const cssHeight = `${scaledHeight}px`;

  const pageEl = document.createElement("div");
  pageEl.className = "pdf-page";
  pageEl.setAttribute("data-page-number", String(pageNumber));
  pageEl.style.width = cssWidth;
  pageEl.style.height = cssHeight;

  const canvasEl = document.createElement("canvas");
  canvasEl.className = "pdf-page__canvas";
  canvasEl.width = Math.floor(scaledWidth * devicePixelRatio);
  canvasEl.height = Math.floor(scaledHeight * devicePixelRatio);
  canvasEl.style.width = cssWidth;
  canvasEl.style.height = cssHeight;

  const textLayerEl = document.createElement("div");
  textLayerEl.className = "textLayer";
  textLayerEl.style.width = cssWidth;
  textLayerEl.style.height = cssHeight;

  pageEl.appendChild(canvasEl);
  pageEl.appendChild(textLayerEl);

  return { pageEl, canvasEl, textLayerEl };
}

/**
 * Возвращает transform для отрисовки canvas с учетом devicePixelRatio.
 */
export function hiDpiTransform(): number[] | null {
  const dpr = window.devicePixelRatio || 1;
  return dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;
}

/**
 * Удаляет все дочерние элементы из контейнера, если контейнер существует.
 */
export function clearChildren(el: HTMLElement | null | undefined): void {
  if (!el) {
    return;
  }
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
