import { Component } from "@angular/core";
import { AsideModalService } from "./components/aside-modal/aside-modal.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  constructor(public asideModal: AsideModalService) {}
}
