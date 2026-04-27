import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Subscription } from "rxjs";

import { FileSource } from "../import-file/import-file.component";
import { DocxRendererService } from "./docx-renderer.service";

@Component({
  selector: "app-docx-preview",
  templateUrl: "./docx-preview.component.html",
  styleUrls: ["./docx-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocxRendererService],
})
export class DocxPreviewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() source: FileSource = null;

  html = "";
  loading = false;
  error: string | null = null;
  warnings: string[] = [];

  private initialized = false;
  private subs = new Subscription();

  constructor(
    private renderer: DocxRendererService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.renderer.htmlChange.subscribe((v: string) => {
        this.html = v;
        this.cdr.markForCheck();
      }),
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
    this.subs.add(
      this.renderer.warningsChange.subscribe((v: string[]) => {
        this.warnings = v;
        this.cdr.markForCheck();
      }),
    );

    this.initialized = true;
    if (this.source) {
      this.renderer.load(this.source);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }
    if (changes.source) {
      if (this.source) {
        this.renderer.load(this.source);
      } else {
        this.renderer.reset();
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
