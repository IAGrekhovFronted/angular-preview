import { Injectable, Type } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type AsideModalInputs<T> = Partial<T>;

export interface AsideModalConfig<T> {
  component: Type<T>;
  inputs?: AsideModalInputs<T>;
  title?: string;
}

export interface AsideModalState {
  opened: boolean;
  component: Type<unknown> | null;
  inputs: Record<string, unknown>;
  title: string | null;
}

export const initialAsideModalState: AsideModalState = {
  opened: false,
  component: null,
  inputs: {},
  title: null,
};

@Injectable({ providedIn: "root" })
export class AsideModalService {
  private readonly stateSubject = new BehaviorSubject<AsideModalState>(
    initialAsideModalState,
  );

  readonly state$ = this.stateSubject.asObservable();

  open<T>(config: AsideModalConfig<T>): void {
    this.stateSubject.next({
      opened: true,
      component: config.component,
      inputs: (config.inputs || {}) as Record<string, unknown>,
      title: config.title || null,
    });
  }

  close(): void {
    this.patchState({ opened: false });
    this.clear();
  }

  clear(): void {
    this.patchState({
      component: null,
      inputs: {},
      title: null,
    });
  }

  private patchState(patch: Partial<AsideModalState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch,
    });
  }
}
