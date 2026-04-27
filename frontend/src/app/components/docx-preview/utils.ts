export async function toArrayBuffer(
  source: string | Uint8Array,
): Promise<ArrayBuffer> {
  if (typeof source === "string") {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Не удалось загрузить файл (HTTP ${response.status})`);
    }
    return response.arrayBuffer();
  }
  const buffer = new ArrayBuffer(source.byteLength);
  new Uint8Array(buffer).set(source);
  return buffer;
}

export function formatError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return "Не удалось отобразить документ";
}
