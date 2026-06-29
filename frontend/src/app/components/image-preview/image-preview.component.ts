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
  @Input() file: Blob | null = null;
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

  private setImageUrl(file: Blob | null): void {
    this.revokeImageUrl();
    this.naturalWidth = 0;
    this.naturalHeight = 0;

    if (!file) {
      this.imageUrl = null;
      return;
    }

    this.imageUrl = URL.createObjectURL(file);
  }

  private revokeImageUrl(): void {
    if (!this.imageUrl) {
      return;
    }

    URL.revokeObjectURL(this.imageUrl);
    this.imageUrl = null;
  }
}
