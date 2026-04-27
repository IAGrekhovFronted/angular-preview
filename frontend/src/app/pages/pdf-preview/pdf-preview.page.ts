import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { PdfSource } from "../../components/import-file/import-file.component";

@Component({
  selector: "pdf-preview-page",
  templateUrl: "./pdf-preview.page.html",
  styleUrls: ["./pdf-preview.page.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPreviewPage {
  pdfSource: PdfSource = null;
  urlInput = "";

  constructor(private cdr: ChangeDetectorRef) {}

  onSourceChange(source: PdfSource): void {
    this.pdfSource = source;
    this.cdr.markForCheck();
  }

  onUrlInputChange(value: string): void {
    this.urlInput = value;
    this.cdr.markForCheck();
  }
}
