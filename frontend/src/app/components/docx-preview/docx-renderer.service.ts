import { EventEmitter, Injectable, OnDestroy } from "@angular/core";

import { FileSource } from "../import-file/import-file.component";
import { convertDocxToHtml, extractWarnings } from "./docx-mammoth";
import { formatError, toArrayBuffer } from "./utils";

@Injectable()
export class DocxRendererService implements OnDestroy {
  readonly htmlChange = new EventEmitter<string>();
  readonly loadingChange = new EventEmitter<boolean>();
  readonly errorChange = new EventEmitter<string | null>();
  readonly warningsChange = new EventEmitter<string[]>();

  private destroyed = false;
  private loadToken = 0;

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  async load(source: FileSource): Promise<void> {
    const token = ++this.loadToken;
    this.emitReset();

    if (!source) {
      return;
    }

    this.loadingChange.emit(true);

    try {
      const arrayBuffer = await toArrayBuffer(source);
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      const result = await convertDocxToHtml(arrayBuffer);
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      this.htmlChange.emit(result.value);
      this.warningsChange.emit(extractWarnings(result.messages));
    } catch (e) {
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      this.errorChange.emit(formatError(e));
    } finally {
      if (!this.destroyed && token === this.loadToken) {
        this.loadingChange.emit(false);
      }
    }
  }

  reset(): void {
    ++this.loadToken;
    this.emitReset();
  }

  private emitReset(): void {
    this.htmlChange.emit("");
    this.errorChange.emit(null);
    this.warningsChange.emit([]);
    this.loadingChange.emit(false);
  }
}
