declare module "mammoth/mammoth.browser" {
  export interface MammothMessage {
    type: "warning" | "error" | "info";
    message: string;
  }

  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  export function convertToHtml(options: {
    arrayBuffer: ArrayBuffer;
  }): Promise<MammothResult>;
}
