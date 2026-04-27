import { EventEmitter, Injectable, NgZone, OnDestroy } from "@angular/core";

import {
  DocxSource,
  docx,
  errorMessage,
  normalizeToBlob,
} from "./docxjs-setup";
import { clearChildren } from "./utils";

@Injectable()
export class DocxRendererService implements OnDestroy {
  readonly loadingChange = new EventEmitter<boolean>();
  readonly errorChange = new EventEmitter<string | null>();

  private bodyContainer: HTMLElement | null = null;
  private styleContainer: HTMLElement | null = null;
  private destroyed = false;
  private loadToken = 0;
  private currentBlob: Blob | null = null;
  private currentOptions: Partial<docx.Options> = {};

  constructor(private zone: NgZone) {}

  ngOnDestroy(): void {
    this.destroyed = true;
    clearChildren(this.bodyContainer);
    clearChildren(this.styleContainer);
  }

  attachContainers(body: HTMLElement, style: HTMLElement): void {
    this.bodyContainer = body;
    this.styleContainer = style;
  }

  async load(
    src: DocxSource,
    options: Partial<docx.Options>,
  ): Promise<void> {
    this.currentOptions = options;
    const token = ++this.loadToken;

    clearChildren(this.bodyContainer);
    clearChildren(this.styleContainer);
    this.loadingChange.emit(true);
    this.errorChange.emit(null);

    if (!src) {
      this.currentBlob = null;
      this.loadingChange.emit(false);
      return;
    }

    try {
      const blob = await normalizeToBlob(src);
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      this.currentBlob = blob;
      await this.render(token);
    } catch (err) {
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      this.errorChange.emit(errorMessage(err));
    } finally {
      if (!this.destroyed && token === this.loadToken) {
        this.loadingChange.emit(false);
      }
    }
  }

  async rerender(options: Partial<docx.Options>): Promise<void> {
    this.currentOptions = options;
    if (!this.currentBlob) {
      return;
    }
    const token = ++this.loadToken;
    clearChildren(this.bodyContainer);
    clearChildren(this.styleContainer);
    this.loadingChange.emit(true);
    this.errorChange.emit(null);

    try {
      await this.render(token);
    } catch (err) {
      if (this.destroyed || token !== this.loadToken) {
        return;
      }
      this.errorChange.emit(errorMessage(err));
    } finally {
      if (!this.destroyed && token === this.loadToken) {
        this.loadingChange.emit(false);
      }
    }
  }

  reset(): void {
    ++this.loadToken;
    this.currentBlob = null;
    clearChildren(this.bodyContainer);
    clearChildren(this.styleContainer);
    this.errorChange.emit(null);
    this.loadingChange.emit(false);
  }

  private async render(token: number): Promise<void> {
    if (!this.bodyContainer || !this.styleContainer || !this.currentBlob) {
      return;
    }
    await this.zone.runOutsideAngular(() =>
      docx.renderAsync(
        this.currentBlob as Blob,
        this.bodyContainer as HTMLElement,
        this.styleContainer as HTMLElement,
        this.currentOptions,
      ),
    );
    if (this.destroyed || token !== this.loadToken) {
      clearChildren(this.bodyContainer);
      clearChildren(this.styleContainer);
    }
  }
}
