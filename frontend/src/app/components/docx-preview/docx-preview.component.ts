import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { FileSource } from "../pdf-preview/pdfjs-setup";
import { normalizeToBlob } from "./utils";

import * as docx from "docx-preview";

@Component({
  selector: "app-docx-preview",
  templateUrl: "./docx-preview.component.html",
  styleUrls: ["./docx-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocxPreviewComponent implements OnChanges {
  @Input() src: FileSource;

  @ViewChild("styleContainer", { static: true })
  styleContainer: ElementRef | null = null;

  @ViewChild("bodyContainer", { static: true })
  bodyContainer: ElementRef | null = null;

  async ngOnChanges(): Promise<void> {
    const blob = await normalizeToBlob(this.src);
    console.log("blob", blob);

    if (this.styleContainer && this.bodyContainer && blob) {
      await docx.renderAsync(
        blob,
        this.bodyContainer.nativeElement,
        this.styleContainer.nativeElement,
      );
    }
  }
}
