import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { PdfSource } from "../../components/import-file/import-file.component";
import { PdfPreviewAsideService } from "../../components/pdf-preview/pdf-preview-aside.service";

@Component({
  selector: "pdf-preview-page",
  templateUrl: "./pdf-preview.page.html",
  styleUrls: ["./pdf-preview.page.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPreviewPage {
  pdfSource: PdfSource = null;
  urlInput = "";

  constructor(
    private cdr: ChangeDetectorRef,
    private pdfPreviewAside: PdfPreviewAsideService,
  ) {}

  onSourceChange(source: PdfSource): void {
    this.pdfSource = source;
    if (source) {
      this.pdfPreviewAside.openFile(source);
    } else {
      this.pdfPreviewAside.close();
    }
    this.cdr.markForCheck();
  }

  onUrlInputChange(value: string): void {
    this.urlInput = value;
    this.cdr.markForCheck();
  }
}
