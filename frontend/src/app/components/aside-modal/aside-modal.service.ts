import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface AsideModalState<T = unknown> {
  opened: boolean;
  data: T | null;
  title: string | null;
}

export const initialAsideModalState: AsideModalState = {
  opened: false,
  data: null,
  title: null,
};

@Injectable({ providedIn: "root" })
export class AsideModalService {
  private readonly stateSubject = new BehaviorSubject<AsideModalState>(
    initialAsideModalState,
  );

  readonly state$ = this.stateSubject.asObservable();

  open<T>(data: T, title: string | null = null): void {
    this.stateSubject.next({
      opened: true,
      data,
      title,
    });
  }

  close(): void {
    this.patchState({ opened: false });
    this.clear();
  }

  clear(): void {
    this.patchState({
      data: null,
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
