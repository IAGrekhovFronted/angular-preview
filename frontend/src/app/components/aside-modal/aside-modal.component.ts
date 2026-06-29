import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { Subscription } from "rxjs";

import {
  AsideModalService,
  AsideModalState,
  initialAsideModalState,
} from "./aside-modal.service";

@Component({
  selector: "app-aside-modal",
  templateUrl: "./aside-modal.component.html",
  styleUrls: ["./aside-modal.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideModalComponent implements OnInit, OnDestroy {
  @ViewChild("contentHost", { read: ViewContainerRef, static: true })
  contentHost!: ViewContainerRef;

  state: AsideModalState = initialAsideModalState;

  private readonly subs = new Subscription();
  private contentRef: ComponentRef<unknown> | null = null;
  private renderedComponent: Type<unknown> | null = null;
  private renderedInputs: Record<string, unknown> | null = null;

  constructor(
    private asideModal: AsideModalService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.asideModal.state$.subscribe((state) => {
        this.state = state;
        this.renderContent(state);
        this.cdr.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.destroyContent();
  }

  close(): void {
    this.asideModal.close();
  }

  private renderContent(state: AsideModalState): void {
    if (!state.component) {
      this.destroyContent();
      return;
    }

    if (
      this.contentRef &&
      this.renderedComponent === state.component &&
      this.renderedInputs === state.inputs
    ) {
      return;
    }

    this.destroyContent();

    const factory = this.componentFactoryResolver.resolveComponentFactory(
      state.component,
    );
    const componentRef = this.contentHost.createComponent(factory);
    Object.assign(componentRef.instance, state.inputs);
    componentRef.changeDetectorRef.detectChanges();

    this.contentRef = componentRef;
    this.renderedComponent = state.component;
    this.renderedInputs = state.inputs;
  }

  private destroyContent(): void {
    if (this.contentRef) {
      this.contentRef.destroy();
      this.contentRef = null;
    }
    this.contentHost.clear();
    this.renderedComponent = null;
    this.renderedInputs = null;
  }
}
