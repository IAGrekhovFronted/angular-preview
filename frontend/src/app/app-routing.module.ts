import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { PdfPreviewPage } from "./pages/pdf-preview/pdf-preview.page";

const routes: Routes = [{ path: "pdf-review-page", component: PdfPreviewPage }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
