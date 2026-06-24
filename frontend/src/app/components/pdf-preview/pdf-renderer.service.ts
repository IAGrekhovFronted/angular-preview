import { Injectable, NgZone, OnDestroy } from "@angular/core";
import { PDFDocumentProxy, PDFRenderTask } from "pdfjs-dist/build/pdf";
import { BehaviorSubject } from "rxjs";

import {
  clearChildren,
  createPdfPageDom,
  hiDpiTransform,
} from "./pdf-page-dom";
import { AsyncGeneration } from "./async-generation";
import {
  errorMessage,
  isCancelledError,
  normalizeSource,
  pdfjsLib,
  FileSource,
} from "./pdfjs-setup";

export interface PdfPreviewState {
  loading: boolean;
  error: string | null;
  totalPages: number;
}

export const initialPdfPreviewState: PdfPreviewState = {
  loading: false,
  error: null,
  totalPages: 0,
};

@Injectable()
export class PdfRendererService implements OnDestroy {
  private readonly stateSubject = new BehaviorSubject<PdfPreviewState>(
    initialPdfPreviewState,
  );

  readonly state$ = this.stateSubject.asObservable();

  private container: HTMLElement | null = null;
  private pdfDoc: PDFDocumentProxy | null = null;
  private renderTasks: PDFRenderTask[] = [];
  private readonly loadGeneration = new AsyncGeneration();
  private currentScaleFactor = 1;

  constructor(private zone: NgZone) {}

  ngOnDestroy(): void {
    this.loadGeneration.invalidate();
    this.cancelRenderTasks();
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
  }

  attachContainer(el: HTMLElement): void {
    this.container = el;
  }

  async load(src: FileSource, scaleFactor: number): Promise<void> {
    this.currentScaleFactor = scaleFactor;
    if (!this.container) {
      return;
    }

    const generation = this.loadGeneration.begin();
    this.cancelRenderTasks();
    clearChildren(this.container);
    if (this.pdfDoc) {
      await this.pdfDoc.destroy();
      this.pdfDoc = null;
    }

    this.patchState({ loading: true, error: null, totalPages: 0 });

    try {
      const pdf = await this.zone.runOutsideAngular(
        () => pdfjsLib.getDocument(normalizeSource(src)).promise,
      );
      if (this.loadGeneration.isStale(generation)) {
        await pdf.destroy();
        return;
      }
      this.pdfDoc = pdf;
      this.patchState({ totalPages: pdf.numPages });
      await this.renderAllPages(generation);
    } catch (err) {
      if (this.loadGeneration.isStale(generation)) {
        return;
      }
      this.patchState({
        error: errorMessage(err) || "Не удалось загрузить PDF",
      });
    } finally {
      if (!this.loadGeneration.isStale(generation)) {
        this.patchState({ loading: false });
      }
    }
  }

  async rerender(scaleFactor: number): Promise<void> {
    this.currentScaleFactor = scaleFactor;
    if (!this.pdfDoc) {
      return;
    }
    await this.renderAllPages(this.loadGeneration.current());
  }

  reset(): void {
    this.loadGeneration.invalidate();
    this.cancelRenderTasks();
    clearChildren(this.container);
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    this.stateSubject.next(initialPdfPreviewState);
  }

  private async renderAllPages(generation: number): Promise<void> {
    this.cancelRenderTasks();
    clearChildren(this.container);
    if (!this.pdfDoc || !this.container) {
      return;
    }
    const total = this.pdfDoc.numPages;
    for (let i = 1; i <= total; i++) {
      if (this.loadGeneration.isStale(generation)) {
        return;
      }
      try {
        await this.renderPage(i, generation);
      } catch (err) {
        if (isCancelledError(err)) {
          return;
        }
        console.error("Ошибка отрисовки страницы", i, err);
      }
    }
  }

  private async renderPage(
    pageNumber: number,
    generation: number,
  ): Promise<void> {
    if (!this.container || !this.pdfDoc) {
      return;
    }
    const pdfDoc = this.pdfDoc;
    const page = await pdfDoc.getPage(pageNumber);
    if (this.loadGeneration.isStale(generation)) {
      return;
    }

    const viewport = page.getViewport({ scale: this.currentScaleFactor });
    const { pageEl, canvasEl, textLayerEl } = createPdfPageDom(
      pageNumber,
      viewport,
    );
    this.container.appendChild(pageEl);

    const renderTask = page.render({
      canvasContext: canvasEl.getContext("2d") as CanvasRenderingContext2D,
      viewport,
      transform: hiDpiTransform(),
    });
    this.renderTasks.push(renderTask);
    await renderTask.promise;

    if (this.loadGeneration.isStale(generation)) {
      return;
    }

    const textContent = await page.getTextContent();
    if (this.loadGeneration.isStale(generation)) {
      return;
    }

    const textLayerTask = pdfjsLib.renderTextLayer({
      textContent,
      container: textLayerEl,
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

  private patchState(patch: Partial<PdfPreviewState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch,
    });
  }
}
