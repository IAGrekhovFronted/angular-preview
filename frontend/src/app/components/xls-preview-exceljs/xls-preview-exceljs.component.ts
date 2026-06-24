import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
} from "@angular/core";
import { Workbook } from "exceljs";
import { FileSource } from "../pdf-preview/pdfjs-setup";
import { normalizeToArrayBuffer } from "../xls-preview/utils";
import { CellView, buildRowsFromExceljs } from "./exceljs-utils";

@Component({
  selector: "app-xls-preview-exceljs",
  templateUrl: "./xls-preview-exceljs.component.html",
  styleUrls: ["./xls-preview-exceljs.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XlsPreviewExceljsComponent implements OnChanges {
  @Input() src: FileSource;
  rows: CellView[][] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnChanges(): Promise<void> {
    const buf = await normalizeToArrayBuffer(this.src);
    if (!buf) {
      this.rows = [];
      this.cdr.markForCheck();
      return;
    }

    const wb = new Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    this.rows = buildRowsFromExceljs(ws);
    this.cdr.markForCheck();
  }

  trackRow(index: number): number {
    return index;
  }

  trackCell(index: number): number {
    return index;
  }
}
