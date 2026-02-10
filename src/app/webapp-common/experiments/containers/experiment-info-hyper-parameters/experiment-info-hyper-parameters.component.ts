import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  selectExperimentConfiguration,
  selectExperimentHyperParamsInfoData,
  selectExperimentHyperParamsSelectedSectionFromRoute,
  selectExperimentSelectedConfigObjectFromRoute,
  selectIsExperimentSaving,
} from '../../reducers';
import {selectBackdropActive} from '@common/core/reducers/view.reducer';
import {combineLatest} from 'rxjs';
import {selectIsExperimentEditable, selectSelectedExperiment} from '~/features/experiments/reducers';
import {selectRouterConfig, selectRouterParams} from '@common/core/reducers/router-reducer';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {debounceTime, filter, withLatestFrom} from 'rxjs/operators';
import {
  getExperimentConfigurationNames,
  getExperimentConfigurationObj,
  setExperimentFormErrors
} from '../../actions/common-experiments-info.actions';
import {min} from 'lodash-es';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {PushPipe} from '@ngrx/component';
import {
  ExperimentHyperParamsNavbarComponent
} from '@common/experiments/dumb/experiment-hyper-params-navbar/experiment-hyper-params-navbar.component';


@Component({
  selector: 'sm-experiment-info-hyper-parameters',
  templateUrl: './experiment-info-hyper-parameters.component.html',
  styleUrls: ['./experiment-info-hyper-parameters.component.scss'],
  imports: [
    OverlayComponent,
    RouterOutlet,
    SplitAreaComponent,
    SplitComponent,
    PushPipe,
    ExperimentHyperParamsNavbarComponent
  ]
})
export class ExperimentInfoHyperParametersComponent {
  private store = inject(Store);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);

  protected minimized = this.route.snapshot.routeConfig?.data?.minimized ?? false;
  protected hyperParamsInfo$ = this.store.select(selectExperimentHyperParamsInfoData);
  protected configuration$ = this.store.select(selectExperimentConfiguration);
  protected editable$ = this.store.select(selectIsExperimentEditable);
  protected saving$ = this.store.select(selectIsExperimentSaving);
  protected backdropActive$ = this.store.select(selectBackdropActive);
  protected routerConfig$ = this.store.select(selectRouterConfig);
  protected routerParams$ = this.store.select(selectRouterParams);
  protected selectedExperiment$ = this.store.select(selectSelectedExperiment);
  private prevSelectedExperimentId: string;

  constructor() {
    this.selectedExperiment$
      .pipe(
        takeUntilDestroyed(),
        filter((selectedExperiment) => selectedExperiment && !selectedExperiment.configuration)
      )
      .subscribe(selectedExperiment => {
        if (selectedExperiment.id !== this.prevSelectedExperimentId) {
          this.store.dispatch(getExperimentConfigurationNames({experimentId: selectedExperiment.id}));
          this.store.dispatch(getExperimentConfigurationObj());
          this.prevSelectedExperimentId = selectedExperiment.id;
        }
      });

    combineLatest([
      this.hyperParamsInfo$,
      this.configuration$
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(0),
        withLatestFrom(
          this.store.select(selectExperimentHyperParamsSelectedSectionFromRoute),
          this.store.select(selectExperimentSelectedConfigObjectFromRoute)
        ))
      .subscribe(([[hyperparams, configuration], selectedHyperParam, selectedConfig]) => {
        if ((hyperparams && configuration && !(selectedHyperParam in hyperparams) && !(selectedConfig in configuration))) {
          this.router.navigate(['hyper-param', min(Object.keys(hyperparams))], {
            relativeTo: this.route,
            replaceUrl: true,
            queryParamsHandling: 'preserve'
          });
        }
      });
    this.store.dispatch(setExperimentFormErrors({errors: null}));
  }
}
