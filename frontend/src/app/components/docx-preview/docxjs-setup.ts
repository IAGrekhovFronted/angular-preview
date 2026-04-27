import * as docx from "docx-preview";

export { docx };

export type DocxSource =
  | string
  | Uint8Array
  | ArrayBuffer
  | Blob
  | null
  | undefined;

export async function normalizeToBlob(
  src: string | Uint8Array | ArrayBuffer | Blob,
): Promise<Blob> {
  if (src instanceof Blob) {
    return src;
  }
  if (typeof src === "string") {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Не удалось загрузить файл (HTTP ${response.status})`);
    }
    return response.blob();
  }
  if (src instanceof ArrayBuffer) {
    return new Blob([src]);
  }

  const buffer = new ArrayBuffer(src.byteLength);
  new Uint8Array(buffer).set(src);
  return new Blob([buffer]);
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return "Не удалось отобразить документ";
}
