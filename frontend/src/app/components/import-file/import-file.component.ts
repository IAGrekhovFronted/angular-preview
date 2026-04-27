import {
  Component,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
} from "@angular/core";

export type FileSource = string | Uint8Array | null;

@Component({
  selector: "import-file",
  templateUrl: "./import-file.component.html",
  styleUrls: ["./import-file.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFileComponent {
  @Output() sourceChange = new EventEmitter<FileSource>();
  @Output() urlChange = new EventEmitter<string>();

  urlInput = "";

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      this.urlInput = "";
      this.urlChange.emit("");
      this.sourceChange.emit(new Uint8Array(buffer));
    };
    reader.readAsArrayBuffer(file);
  }

  onUrlChanged(value: string): void {
    this.urlInput = value;
    this.urlChange.emit(value);
    this.sourceChange.emit(value ? value : null);
  }
}
