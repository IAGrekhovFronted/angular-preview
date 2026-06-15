declare module "pdfjs-dist/build/pdf" {
  export interface GlobalWorkerOptionsType {
    workerSrc: string;
    workerPort: Worker | null;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptionsType;
  export const version: string;

  export interface PDFDocumentSource {
    url?: string;
    data?: Uint8Array;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
    transform: number[];
    [key: string]: unknown;
  }

  export interface PDFTextContent {
    items: unknown[];
    styles: { [key: string]: unknown };
  }

  export interface PDFRenderTask {
    promise: Promise<void>;
    cancel(): void;
  }

  export function getDocument(src: PDFDocumentSource): {
    promise: Promise<PDFDocumentProxy>;
  };

  export function renderTextLayer(params: {
    textContent: PDFTextContent;
    container: HTMLElement;
    viewport: PDFPageViewport;
    textDivs?: HTMLElement[];
    enhanceTextSelection?: boolean;
    timeout?: number;
  }): PDFRenderTask;

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number; rotation?: number }): PDFPageViewport;
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
      transform?: number[] | null;
    }): PDFRenderTask;
    getTextContent(): Promise<PDFTextContent>;
  }
}
