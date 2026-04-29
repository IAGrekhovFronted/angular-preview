import * as pdfjsLib from "pdfjs-dist/build/pdf";

/**
 * В angular.json указано копирование из node_modules при сборке
 * Подход позволит синхронизировать версию воркера с версией библиотеки, используемой в коде
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/pdfjs/pdf.worker.min.js";

export { pdfjsLib };

export type FileSource = string | Uint8Array | ArrayBuffer | null | undefined;

export function normalizeSource(src: FileSource): any {
  if (typeof src === "string") {
    return { url: src };
  }
  if (src instanceof ArrayBuffer) {
    return { data: new Uint8Array(src) };
  }
  return { data: src };
}

export function isCancelledError(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  return (
    !!e &&
    (e.name === "RenderingCancelledException" ||
      e.message === "Rendering cancelled")
  );
}

export function errorMessage(err: unknown): string {
  const e = err as { message?: unknown } | null;
  return e && typeof e.message === "string" ? e.message : "";
}
