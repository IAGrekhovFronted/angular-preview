import { FileSource } from "../pdf-preview/pdfjs-setup";

export const normalizeToArrayBuffer = async (
  src: FileSource,
): Promise<ArrayBuffer | null> => {
  if (!src) {
    return null;
  }

  if (typeof src === "string") {
    const res = await fetch(src);

    if (!res.ok) {
      throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    }

    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer).slice().buffer;
  }

  if (src instanceof Blob) {
    const buffer = await (src as any).arrayBuffer();
    return new Uint8Array(buffer).slice().buffer;
  }

  if (src instanceof ArrayBuffer) {
    return src;
  }

  if (src instanceof Uint8Array) {
    // Копируем данные в новый ArrayBuffer, исключая SharedArrayBuffer
    return src.slice().buffer;
  }

  throw new Error("Unsupported source type");
};
