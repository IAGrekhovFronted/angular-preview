import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";

import * as pdfjsLib from "pdfjs-dist/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/pdfjs/pdf.worker.min.js";

type PdfSource = string | Uint8Array | ArrayBuffer | null | undefined;

@Component({
  selector: "app-pdf-preview",
  templateUrl: "./pdf-preview.component.html",
  styleUrls: ["./pdf-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PdfPreviewComponent implements OnChanges, OnDestroy {
  @Input() src: PdfSource;
  @Input() scale = 1.25;

  @ViewChild("pagesContainer", { static: true })
  pagesContainer!: ElementRef<HTMLDivElement>;

  loading = false;
  error: string | null = null;
  totalPages = 0;

  private pdfDoc: any = null;
  private renderTasks: any[] = [];
  private destroyed = false;
  private loadToken = 0;

  constructor(
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.src) {
      if (this.src) {
        this.load();
      } else {
        this.reset();
      }
      return;
    }
    if (changes.scale && !changes.scale.firstChange && this.pdfDoc) {
      this.renderAllPages();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelRenderTasks();
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
  }

  zoomIn(): void {
    this.scale = Math.min(4, +(this.scale + 0.25).toFixed(2));
    this.cdr.markForCheck();
    if (this.pdfDoc) {
      this.renderAllPages();
    }
  }

  zoomOut(): void {
    this.scale = Math.max(0.25, +(this.scale - 0.25).toFixed(2));
    this.cdr.markForCheck();
    if (this.pdfDoc) {
      this.renderAllPages();
    }
  }

  private reset(): void {
    this.cancelRenderTasks();
    this.clearContainer();
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    this.totalPages = 0;
    this.error = null;
    this.loading = false;
    this.cdr.markForCheck();
  }

  private async load(): Promise<void> {
    const token = ++this.loadToken;
    this.cancelRenderTasks();
    this.clearContainer();
    if (this.pdfDoc) {
      await this.pdfDoc.destroy();
      this.pdfDoc = null;
    }

    this.loading = true;
    this.error = null;
    this.totalPages = 0;
    this.cdr.markForCheck();

    try {
      const pdf = await this.zone.runOutsideAngular(
        () => pdfjsLib.getDocument(this.buildSource()).promise,
      );
      if (this.destroyed || token !== this.loadToken) {
        await pdf.destroy();
        return;
      }
      this.pdfDoc = pdf;
      this.totalPages = pdf.numPages;
      await this.renderAllPages(token);
    } catch (err) {
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      this.error = (err && err.message) || "Не удалось загрузить PDF";
    } finally {
      if (!this.destroyed && token === this.loadToken) {
        this.loading = false;
        this.cdr.markForCheck();
      }
    }
  }

  private buildSource(): any {
    if (typeof this.src === "string") {
      return { url: this.src };
    }
    if (this.src instanceof ArrayBuffer) {
      return { data: new Uint8Array(this.src) };
    }
    return { data: this.src };
  }

  private clearContainer(): void {
    const el = this.pagesContainer && this.pagesContainer.nativeElement;
    if (!el) {
      return;
    }
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
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

  private async renderAllPages(token: number = this.loadToken): Promise<void> {
    this.cancelRenderTasks();
    this.clearContainer();
    if (!this.pdfDoc) {
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
        if (
          err &&
          (err.name === "RenderingCancelledException" ||
            err.message === "Rendering cancelled")
        ) {
          return;
        }
        console.error("Ошибка отрисовки страницы", i, err);
      }
    }
  }

  private async renderPage(pageNumber: number, token: number): Promise<void> {
    const page = await this.pdfDoc.getPage(pageNumber);
    if (this.destroyed || token !== this.loadToken) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: this.scale });
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
    this.pagesContainer.nativeElement.appendChild(pageEl);

    const ctx = canvas.getContext("2d");
    const transform =
      devicePixelRatio !== 1
        ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0]
        : null;

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
      transform,
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
}
