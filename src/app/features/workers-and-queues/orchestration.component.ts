import {Component, DestroyRef, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {ORCHESTRATION_ROUTES} from '~/features/workers-and-queues/workers-and-queues.consts';
import {headerActions} from '@common/core/actions/router.actions';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'sm-orchestration',
  templateUrl: './orchestration.component.html',
  styleUrls: ['./orchestration.component.scss'],
  standalone: false
})
export class OrchestrationComponent {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.store.select(selectRouterConfig)
      .pipe(
        takeUntilDestroyed(),
        debounceTime(100),
        map(conf => conf?.[1]),
        filter(feature => !!feature),
        distinctUntilChanged(),
      )
      .subscribe((feature) => {
        this.store.dispatch(headerActions.setTabs({contextMenu: ORCHESTRATION_ROUTES, active: feature}))
      });

    this.destroyRef.onDestroy(() => {
      this.store.dispatch(headerActions.reset());
    })
  }
}
