import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
} from "@angular/core";
import * as xlsx from "xlsx";
import { FileSource } from "../pdf-preview/pdfjs-setup";
import { normalizeToArrayBuffer } from "../xls-preview/utils";
import { CellView, buildRows } from "./styled-utils";

@Component({
  selector: "app-xls-preview-styled",
  templateUrl: "./xls-preview-styled.component.html",
  styleUrls: ["./xls-preview-styled.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XlsPreviewStyledComponent implements OnChanges {
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

    const wb: any = xlsx.read(buf, { type: "array", cellStyles: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    this.rows = buildRows(sheet, wb.Styles);
    this.cdr.markForCheck();
  }

  trackRow(index: number): number {
    return index;
  }

  trackCell(index: number): number {
    return index;
  }
}
