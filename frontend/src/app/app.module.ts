import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PdfPreviewComponent } from "./components/pdf-preview/pdf-preview.component";
import { PdfPreviewPage } from "./pages/pdf-preview/pdf-preview.page";
import { ImportFileComponent } from "./components/import-file/import-file.component";
import { DocxPreviewComponent } from "./components/docx-preview/docx-preview.component";
import { DocxPreviewPage } from "./pages/docx-preview/docx-preview.page";

@NgModule({
  declarations: [
    AppComponent,
    PdfPreviewComponent,
    PdfPreviewPage,
    DocxPreviewComponent,
    DocxPreviewPage,
    ImportFileComponent,
  ],
  imports: [BrowserModule, CommonModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
