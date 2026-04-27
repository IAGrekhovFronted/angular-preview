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

import { DocxRendererService } from "./docx-renderer.service";
import { DocxSource, docx } from "./docxjs-setup";

@Component({
  selector: "app-docx-preview",
  templateUrl: "./docx-preview.component.html",
  styleUrls: ["./docx-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DocxRendererService],
})
export class DocxPreviewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() src: DocxSource;

  @ViewChild("bodyContainer", { static: true })
  bodyContainer!: ElementRef<HTMLDivElement>;

  @ViewChild("styleContainer", { static: true })
  styleContainer!: ElementRef<HTMLDivElement>;

  loading = false;
  error: string | null = null;
  breakPages = true;
  renderHeaders = true;

  private initialized = false;
  private subs = new Subscription();

  constructor(
    private renderer: DocxRendererService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.renderer.attachContainers(
      this.bodyContainer.nativeElement,
      this.styleContainer.nativeElement,
    );
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

    this.initialized = true;
    if (this.src) {
      this.renderer.load(this.src, this.getOptions());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }
    if (changes.src) {
      if (this.src) {
        this.renderer.load(this.src, this.getOptions());
      } else {
        this.renderer.reset();
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleBreakPages(): void {
    this.breakPages = !this.breakPages;
    this.cdr.markForCheck();
    this.renderer.rerender(this.getOptions());
  }

  toggleHeaders(): void {
    this.renderHeaders = !this.renderHeaders;
    this.cdr.markForCheck();
    this.renderer.rerender(this.getOptions());
  }

  private getOptions(): Partial<docx.Options> {
    return {
      inWrapper: true,
      breakPages: this.breakPages,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: this.renderHeaders,
      renderFooters: this.renderHeaders,
      experimental: true,
    };
  }
}
