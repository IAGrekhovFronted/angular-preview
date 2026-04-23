declare module "pdfjs-dist/build/pdf" {
  export interface GlobalWorkerOptionsType {
    workerSrc: string;
    workerPort: any;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptionsType;
  export const version: string;

  export function getDocument(src: any): {
    promise: Promise<PDFDocumentProxy>;
  };

  export function renderTextLayer(params: {
    textContent: any;
    container: HTMLElement;
    viewport: any;
    textDivs?: HTMLElement[];
    enhanceTextSelection?: boolean;
    timeout?: number;
  }): { promise: Promise<void>; cancel(): void };

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number; rotation?: number }): any;
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: any;
      transform?: number[] | null;
    }): { promise: Promise<void>; cancel(): void };
    getTextContent(): Promise<any>;
  }
}
