import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { PdfPreviewPage } from "./pages/pdf-preview/pdf-preview.page";
import { DocxPreviewPage } from "./pages/docx-preview/docx-preview.page";
import { XlsPreviewPage } from "./pages/xls-preview/xls-preview.page";

const routes: Routes = [
  { path: "pdf-preview", component: PdfPreviewPage },
  { path: "docx-preview", component: DocxPreviewPage },
  { path: "xls-preview", component: XlsPreviewPage },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
