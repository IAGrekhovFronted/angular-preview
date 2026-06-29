import { Injectable } from "@angular/core";

import { AsideModalService } from "../aside-modal/aside-modal.service";
import { PdfSource } from "../import-file/import-file.component";
import { PdfPreviewComponent } from "./pdf-preview.component";

@Injectable({ providedIn: "root" })
export class PdfPreviewAsideService {
  constructor(private asideModal: AsideModalService) {}

  openFile(src: PdfSource): void {
    if (!src) {
      this.close();
      return;
    }

    this.asideModal.open<PdfPreviewComponent>({
      component: PdfPreviewComponent,
      inputs: {
        src,
        scale: 100,
      },
      title: "PDF Preview",
    });
  }

  close(): void {
    this.asideModal.close();
  }

  clear(): void {
    this.asideModal.clear();
  }
}
