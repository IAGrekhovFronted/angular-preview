import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { PdfSource } from "../../components/import-file/import-file.component";
import { FileSource } from "src/app/components/pdf-preview/pdfjs-setup";

@Component({
  selector: "docx-preview-page",
  templateUrl: "./docx-preview.page.html",
  styleUrls: ["./docx-preview.page.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocxPreviewPage {
  docxSource: FileSource = null;
  urlInput = "";

  constructor(private cdr: ChangeDetectorRef) {}

  onSourceChange(source: PdfSource): void {
    this.docxSource = source;
    this.cdr.markForCheck();
  }

  onUrlInputChange(value: string): void {
    this.urlInput = value;
    this.cdr.markForCheck();
  }
}
