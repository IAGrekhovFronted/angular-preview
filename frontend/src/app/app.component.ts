import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  pdfSource: string | Uint8Array | null = null;
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
      this.pdfSource = new Uint8Array(buffer);
    };
    reader.readAsArrayBuffer(file);
  }

  onUrlChanged(value: string): void {
    this.urlInput = value;
    this.pdfSource = value ? value : null;
  }
}
