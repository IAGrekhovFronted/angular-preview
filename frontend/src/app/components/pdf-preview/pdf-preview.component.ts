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

import {
  initialPdfPreviewState,
  PdfPreviewState,
  PdfRendererService,
} from "./pdf-renderer.service";
import { FileSource } from "./pdfjs-setup";

@Component({
  selector: "app-pdf-preview",
  templateUrl: "./pdf-preview.component.html",
  styleUrls: ["./pdf-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PdfRendererService],
})
export class PdfPreviewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() src: FileSource;
  @Input() scale = 100;

  @ViewChild("pagesContainer", { static: true })
  pagesContainer!: ElementRef<HTMLDivElement>;

  state: PdfPreviewState = initialPdfPreviewState;

  get scalePercent(): number {
    return Math.round(this.scale);
  }

  private subs = new Subscription();

  constructor(
    private renderer: PdfRendererService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.renderer.state$.subscribe((state) => {
        this.state = state;
        this.cdr.markForCheck();
      }),
    );
    this.renderer.attachContainer(this.pagesContainer.nativeElement);
    if (this.src) {
      this.renderer.load(this.src, this.renderScale);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.src && !changes.src.firstChange) {
      if (this.src) {
        this.renderer.load(this.src, this.renderScale);
      } else {
        this.renderer.reset();
      }
      return;
    }
    if (changes.scale && !changes.scale.firstChange) {
      this.renderer.rerender(this.renderScale);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  zoomIn(): void {
    this.setScale(this.scale + 25);
  }

  zoomOut(): void {
    this.setScale(this.scale - 25);
  }

  private setScale(next: number): void {
    this.scale = Math.min(400, Math.max(25, Math.round(next)));
    this.cdr.markForCheck();
    this.renderer.rerender(this.renderScale);
  }

  private get renderScale(): number {
    return this.scale / 100;
  }
}
