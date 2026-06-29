import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";

@Component({
  selector: "app-aside-modal",
  templateUrl: "./aside-modal.component.html",
  styleUrls: ["./aside-modal.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideModalComponent {
  @Input() opened = false;
  @Input() title: string | null = null;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
