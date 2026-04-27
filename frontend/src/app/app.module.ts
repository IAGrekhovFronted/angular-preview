import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { PdfPreviewComponent } from "./components/pdf-preview/pdf-preview.component";
import { PdfPreviewPage } from "./pages/pdf-preview/pdf-preview.page";
import { ImportFileComponent } from "./components/import-file/import-file.component";

@NgModule({
  declarations: [
    AppComponent,
    PdfPreviewComponent,
    PdfPreviewPage,
    ImportFileComponent,
  ],
  imports: [BrowserModule, CommonModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
