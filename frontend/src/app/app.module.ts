import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PdfPreviewComponent } from "./components/pdf-preview/pdf-preview.component";
import { PdfPreviewPage } from "./pages/pdf-preview/pdf-preview.page";
import { ImportFileComponent } from "./components/import-file/import-file.component";
import { DocxPreviewPage } from "./pages/docx-preview/docx-preview.page";
import { DocxPreviewComponent } from "./components/docx-preview/docx-preview.component";
import { ImagePreviewComponent } from "./components/image-preview/image-preview.component";
import { AsideModalComponent } from "./components/aside-modal/aside-modal.component";

@NgModule({
  declarations: [
    AppComponent,
    AsideModalComponent,
    DocxPreviewPage,
    PdfPreviewPage,
    PdfPreviewComponent,
    DocxPreviewComponent,
    ImagePreviewComponent,
    ImportFileComponent,
  ],
  imports: [BrowserModule, CommonModule, AppRoutingModule],
  providers: [],
  entryComponents: [PdfPreviewComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
