import { FileSource } from "../pdf-preview/pdfjs-setup";

export const normalizeToBlob = async (
  src: FileSource,
): Promise<Blob | null> => {
  if (!src) {
    return null;
  }

  if (src instanceof Blob) {
    return src;
  }

  if (typeof src === "string") {
    const file = await fetch(src).then((res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to fetch file: ${res.status} ${res.statusText}`,
        );
      }
      return res.blob();
    });

    return file;
  }

  if (src instanceof ArrayBuffer) {
    return new Blob([src]);
  }

  if (src instanceof Uint8Array) {
    return new Blob([src.slice().buffer]);
  }

  throw new Error("Unsupported source type");
};
