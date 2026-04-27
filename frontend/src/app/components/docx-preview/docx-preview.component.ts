import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
} from "@angular/core";
import { FileSource } from "../pdf-preview/pdfjs-setup";

@Component({
  selector: "app-docx-preview",
  templateUrl: "./docx-preview.component.html",
  styleUrls: ["./docx-preview.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocxPreviewComponent {
  @Input() src: FileSource;
}
