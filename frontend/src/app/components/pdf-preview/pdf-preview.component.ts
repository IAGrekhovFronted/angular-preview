import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { Subscription } from "rxjs";

import { PdfRendererService } from "./pdf-renderer.service";
import { PdfSource } from "./pdfjs-setup";

@Component({
  selector: "app-pdf-preview",
  templateUrl: "./pdf-preview.component.html",
  styleUrls: ["./pdf-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PdfRendererService],
})
export class PdfPreviewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() src: PdfSource;
  @Input() scale = 1.25;

  @ViewChild("pagesContainer", { static: true })
  pagesContainer!: ElementRef<HTMLDivElement>;

  loading = false;
  error: string | null = null;
  totalPages = 0;

  get scalePercent(): number {
    return Math.round(this.scale * 100);
  }

  private initialized = false;
  private subs = new Subscription();

  constructor(
    private renderer: PdfRendererService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.renderer.attachContainer(this.pagesContainer.nativeElement);
    this.subs.add(
      this.renderer.loadingChange.subscribe((v: boolean) => {
        this.loading = v;
        this.cdr.markForCheck();
      }),
    );
    this.subs.add(
      this.renderer.errorChange.subscribe((v: string | null) => {
        this.error = v;
        this.cdr.markForCheck();
      }),
    );
    this.subs.add(
      this.renderer.totalPagesChange.subscribe((v: number) => {
        this.totalPages = v;
        this.cdr.markForCheck();
      }),
    );

    this.initialized = true;
    if (this.src) {
      this.renderer.load(this.src, this.scale);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }
    if (changes.src) {
      if (this.src) {
        this.renderer.load(this.src, this.scale);
      } else {
        this.renderer.reset();
      }
      return;
    }
    if (changes.scale && !changes.scale.firstChange) {
      this.renderer.rerender(this.scale);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  zoomIn(): void {
    this.setScale(this.scale + 0.25);
  }

  zoomOut(): void {
    this.setScale(this.scale - 0.25);
  }

  private setScale(next: number): void {
    this.scale = Math.min(4, Math.max(0.25, +next.toFixed(2)));
    this.cdr.markForCheck();
    this.renderer.rerender(this.scale);
  }
}
