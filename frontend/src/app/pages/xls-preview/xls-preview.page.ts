import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { PdfSource } from "../../components/import-file/import-file.component";

@Component({
  selector: "xls-preview-page",
  templateUrl: "./xls-preview.page.html",
  styleUrls: ["./xls-preview.page.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XlsPreviewPage {
  xlsSource: PdfSource = null;
  urlInput = "";

  constructor(private cdr: ChangeDetectorRef) {}

  onSourceChange(source: PdfSource): void {
    this.xlsSource = source;
    this.cdr.markForCheck();
  }

  onUrlInputChange(value: string): void {
    this.urlInput = value;
    this.cdr.markForCheck();
  }
}
