import {Component, inject, viewChild, effect, input, ChangeDetectionStrategy} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {MatTabNav, MatTabsModule} from '@angular/material/tabs';
import {UpperCasePipe} from '@angular/common';
import {Store} from '@ngrx/store';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {debounceTime} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export interface Link {
  name: string;
  url: string[];
  activeBy?: string;
}

@Component({
    selector: 'sm-router-tab-nav-bar',
    templateUrl: './router-tab-nav-bar.component.html',
    styleUrls: ['./router-tab-nav-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatTabsModule,
        RouterLink,
        UpperCasePipe,
        RouterLinkActive,
    ]
})
export class RouterTabNavBarComponent {
  private store = inject(Store);

  protected routerConfig = this.store.selectSignal(selectRouterConfig);
  private resize$ = new BehaviorSubject(0);

  links = input<Link[]>([]);
  splitSize = input<number>();
  matTabNav = viewChild(MatTabNav);

  constructor() {
    effect(() => {
      this.resize$.next(this.splitSize());
    });

    this.resize$
      .pipe(
        takeUntilDestroyed(),
        debounceTime(50)
      )
      .subscribe(() => this.matTabNav().updatePagination());
    window.setTimeout(() => this.resize$.next(1), 500);
  }
}
