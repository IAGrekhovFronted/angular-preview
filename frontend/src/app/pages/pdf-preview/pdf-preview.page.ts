import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { PdfSource } from "../../components/import-file/import-file.component";
import { AsideModalService } from "../../components/aside-modal/aside-modal.service";

@Component({
  selector: "pdf-preview-page",
  templateUrl: "./pdf-preview.page.html",
  styleUrls: ["./pdf-preview.page.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPreviewPage {
  urlInput = "";

  constructor(
    private cdr: ChangeDetectorRef,
    private asideModal: AsideModalService,
  ) {}

  onSourceChange(source: PdfSource): void {
    if (source) {
      this.asideModal.open<PdfSource>(source, "PDF Preview");
    } else {
      this.asideModal.close();
    }
    this.cdr.markForCheck();
  }

  onUrlInputChange(value: string): void {
    this.urlInput = value;
    this.cdr.markForCheck();
  }
}
