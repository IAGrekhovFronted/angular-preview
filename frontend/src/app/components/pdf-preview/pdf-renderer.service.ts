import { EventEmitter, Injectable, NgZone, OnDestroy } from "@angular/core";

import {
  clearChildren,
  createPdfPageDom,
  hiDpiTransform,
} from "./pdf-page-dom";
import {
  errorMessage,
  isCancelledError,
  normalizeSource,
  pdfjsLib,
  PdfSource,
} from "./pdfjs-setup";

@Injectable()
export class PdfRendererService implements OnDestroy {
  readonly loadingChange = new EventEmitter<boolean>();
  readonly errorChange = new EventEmitter<string | null>();
  readonly totalPagesChange = new EventEmitter<number>();

  private container: HTMLElement | null = null;
  private pdfDoc: any = null;
  private renderTasks: any[] = [];
  private destroyed = false;
  private loadToken = 0;
  private currentScale = 1;

  constructor(private zone: NgZone) {}

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelRenderTasks();
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
  }

  attachContainer(el: HTMLElement): void {
    this.container = el;
  }

  async load(src: PdfSource, scale: number): Promise<void> {
    this.currentScale = scale;
    const token = ++this.loadToken;
    this.cancelRenderTasks();
    clearChildren(this.container);
    if (this.pdfDoc) {
      await this.pdfDoc.destroy();
      this.pdfDoc = null;
    }

    this.loadingChange.emit(true);
    this.errorChange.emit(null);
    this.totalPagesChange.emit(0);

    try {
      const pdf = await this.zone.runOutsideAngular(
        () => pdfjsLib.getDocument(normalizeSource(src)).promise,
      );
      if (this.destroyed || token !== this.loadToken) {
        await pdf.destroy();
        return;
      }
      this.pdfDoc = pdf;
      this.totalPagesChange.emit(pdf.numPages);
      await this.renderAllPages(token);
    } catch (err) {
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      this.errorChange.emit(errorMessage(err) || "Не удалось загрузить PDF");
    } finally {
      if (!this.destroyed && token === this.loadToken) {
        this.loadingChange.emit(false);
      }
    }
  }

  async rerender(scale: number): Promise<void> {
    this.currentScale = scale;
    if (!this.pdfDoc) {
      return;
    }
    await this.renderAllPages(this.loadToken);
  }

  reset(): void {
    this.cancelRenderTasks();
    clearChildren(this.container);
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    this.totalPagesChange.emit(0);
    this.errorChange.emit(null);
    this.loadingChange.emit(false);
  }

  private async renderAllPages(token: number): Promise<void> {
    this.cancelRenderTasks();
    clearChildren(this.container);
    if (!this.pdfDoc || !this.container) {
      return;
    }
    const total = this.pdfDoc.numPages;
    for (let i = 1; i <= total; i++) {
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      try {
        await this.renderPage(i, token);
      } catch (err) {
        if (isCancelledError(err)) {
          return;
        }
        console.error("Ошибка отрисовки страницы", i, err);
      }
    }
  }

  private async renderPage(pageNumber: number, token: number): Promise<void> {
    if (!this.container) {
      return;
    }
    const page = await this.pdfDoc.getPage(pageNumber);
    if (this.destroyed || token !== this.loadToken) {
      return;
    }

    const viewport = page.getViewport({ scale: this.currentScale });
    const { pageEl, canvas, textLayerDiv } = createPdfPageDom(
      pageNumber,
      viewport,
    );
    this.container.appendChild(pageEl);

    const renderTask = page.render({
      canvasContext: canvas.getContext("2d") as CanvasRenderingContext2D,
      viewport,
      transform: hiDpiTransform(),
    });
    this.renderTasks.push(renderTask);
    await renderTask.promise;

    if (this.destroyed || token !== this.loadToken) {
      return;
    }

    const textContent = await page.getTextContent();
    if (this.destroyed || token !== this.loadToken) {
      return;
    }

    const textLayerTask = pdfjsLib.renderTextLayer({
      textContent,
      container: textLayerDiv,
      viewport,
      textDivs: [],
      enhanceTextSelection: true,
    });
    this.renderTasks.push(textLayerTask);
    await textLayerTask.promise;
  }

  private cancelRenderTasks(): void {
    for (const task of this.renderTasks) {
      try {
        task.cancel();
      } catch (_) {
        // ignore
      }
    }
    this.renderTasks = [];
  }
}
