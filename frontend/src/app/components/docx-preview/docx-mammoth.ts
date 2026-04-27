import * as mammoth from "mammoth/mammoth.browser";

export interface MammothMessage {
  type: "warning" | "error" | "info";
  message: string;
}

export interface MammothResult {
  value: string;
  messages: MammothMessage[];
}

export function convertDocxToHtml(
  arrayBuffer: ArrayBuffer,
): Promise<MammothResult> {
  return mammoth.convertToHtml({ arrayBuffer });
}

export function extractWarnings(
  messages: MammothMessage[] | undefined,
): string[] {
  return (messages || [])
    .filter((m: MammothMessage) => m.type === "warning" || m.type === "error")
    .map((m: MammothMessage) => m.message);
}
