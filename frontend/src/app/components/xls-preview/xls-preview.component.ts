import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
} from "@angular/core";
import { FileSource } from "../pdf-preview/pdfjs-setup";
import { normalizeToArrayBuffer } from "./utils";

import * as xlsx from "xlsx";

@Component({
  selector: "app-xls-preview",
  templateUrl: "./xls-preview.component.html",
  styleUrls: ["./xls-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XlsPreviewComponent implements OnChanges {
  htmlContent: string = "";

  @Input() src: FileSource;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnChanges(): Promise<void> {
    const arrayBuffer = await normalizeToArrayBuffer(this.src);
    const workbook = xlsx.read(arrayBuffer, { type: "array" });

    console.log("Workbook:", workbook);
    const data = xlsx.utils.sheet_to_html(
      workbook.Sheets[workbook.SheetNames[0]],
    );

    this.htmlContent = data;
    this.cdr.markForCheck();
  }
}
