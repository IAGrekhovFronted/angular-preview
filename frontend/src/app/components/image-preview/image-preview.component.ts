import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from "@angular/core";

@Component({
  selector: "app-image-preview",
  templateUrl: "./image-preview.component.html",
  styleUrls: ["./image-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewComponent implements OnChanges, OnDestroy {
  @Input() file: ArrayBuffer | null = null;
  @Input() scale = 100;

  imageUrl: string | null = null;
  naturalWidth = 0;
  naturalHeight = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  get scaledWidth(): number | null {
    return this.naturalWidth
      ? Math.round(this.naturalWidth * this.scaleFactor)
      : null;
  }

  get scaledHeight(): number | null {
    return this.naturalHeight
      ? Math.round(this.naturalHeight * this.scaleFactor)
      : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.file) {
      this.setImageUrl(this.file);
    }
  }

  ngOnDestroy(): void {
    this.revokeImageUrl();
  }

  onImageLoad(event: Event): void {
    const imageEl = event.target as HTMLImageElement;
    this.naturalWidth = imageEl.naturalWidth;
    this.naturalHeight = imageEl.naturalHeight;
    this.cdr.markForCheck();
  }

  private get scaleFactor(): number {
    return Math.max(0.01, this.scale / 100);
  }

  private setImageUrl(file: ArrayBuffer | null): void {
    this.revokeImageUrl();
    this.naturalWidth = 0;
    this.naturalHeight = 0;

    if (!file) {
      this.imageUrl = null;
      return;
    }

    this.imageUrl = URL.createObjectURL(
      new Blob([file], { type: this.detectImageMimeType(file) }),
    );
  }

  private revokeImageUrl(): void {
    if (!this.imageUrl) {
      return;
    }

    URL.revokeObjectURL(this.imageUrl);
    this.imageUrl = null;
  }

  private detectImageMimeType(file: ArrayBuffer): string {
    const bytes = new Uint8Array(file);
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return "image/png";
    }
    if (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    ) {
      return "image/jpeg";
    }
    return "";
  }
}
