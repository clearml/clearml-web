import {Component, inject, OnDestroy} from '@angular/core';
import {ActiveSectionEnum} from '@common/experiments/experiment.consts';
import {Store} from '@ngrx/store';
import {selectBackdropActive} from '@common/core/reducers/view.reducer';
import {combineLatest, Observable, pairwise, Subscription} from 'rxjs';
import {
  selectArtifactId,
  selectCurrentArtifactExperimentId,
  selectExperimentModelInfoData,
  selectSelectedExperimentFromRouter
} from '../../reducers';
import {
  selectExperimentInfoData,
  selectIsExperimentEditable,
  selectSelectedExperiment
} from '~/features/experiments/reducers';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {debounceTime, distinctUntilChanged, filter, map, startWith} from 'rxjs/operators';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {IExperimentModelInfo} from '../../shared/common-experiment-model.model';
import {
  getExperimentArtifacts,
  setExperimentArtifacts
} from '@common/experiments/actions/common-experiments-info.actions';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {
  ExperimentArtifactsNavbarComponent
} from '@common/experiments/dumb/experiment-artifacts-navbar/experiment-artifacts-navbar.component';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {NgTemplateOutlet} from '@angular/common';
import {PushPipe} from '@ngrx/component';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-experiment-info-artifacts-model',
  templateUrl: './experiment-info-artifacts.component.html',
  styleUrls: ['./experiment-info-artifacts.component.scss'],
  imports: [
    OverlayComponent,
    ExperimentArtifactsNavbarComponent,
    SplitAreaComponent,
    SplitComponent,
    NgTemplateOutlet,
    MatIconModule,
    PushPipe,
    RouterOutlet
  ]
})
export class ExperimentInfoArtifactsComponent implements OnDestroy {
  private store = inject(Store);
  public router = inject(Router);
  private route = inject(ActivatedRoute);

  public backdropActive$: Observable<boolean>;
  public modelInfo$: Observable<IExperimentModelInfo>;
  public experimentInfo$: Observable<IExperimentInfo>;
  public activeSection: ActiveSectionEnum;
  public selectedId$: Observable<string>;
  private experimentKey$: Observable<string>;
  public routerConfig$: Observable<string[]>;
  public editable$: Observable<boolean>;
  public minimized: boolean;
  private previousTarget: string;
  private sub = new Subscription();

  constructor() {
    this.minimized = !!this.route.snapshot?.routeConfig?.data?.minimized;
    this.backdropActive$ = this.store.select(selectBackdropActive);
    this.editable$ = this.store.select(selectIsExperimentEditable);
    this.modelInfo$ = this.store.select(selectExperimentModelInfoData);
    this.experimentInfo$ = this.store.select(selectExperimentInfoData);
    this.routerConfig$ = this.store.select(selectRouterConfig);
    this.selectedId$ = this.store.select(selectArtifactId);
    this.experimentKey$ = this.store.select(selectSelectedExperimentFromRouter);

    this.sub.add(this.store.select(selectRouterConfig)
      .pipe(filter(rc => !!rc))
      .subscribe((routerConfig: string[]) => {
        this.activeSection = (this.minimized ? routerConfig[5] : routerConfig[6]) as ActiveSectionEnum;
      })
    );

    this.sub.add(combineLatest([
        this.store.select(selectSelectedProject),
        this.store.select(selectSelectedExperiment)
      ])
        .pipe(
          debounceTime(0),
          filter(([project, selectedExperiment]) => !!project?.id && !!selectedExperiment),
          map(([, selectedExperiment]) => selectedExperiment.id),
          startWith(null), // emitting first empty value to fill-in the buffer
          pairwise()
        )
        .subscribe(([previousId, experimentId]) => {
          if (previousId !== experimentId) {
            this.store.dispatch(setExperimentArtifacts({model: null, experimentId: null}));
          }
          this.store.dispatch(getExperimentArtifacts({experimentId}));
        })
    );

    this.sub.add(combineLatest([
        this.selectedId$,
        this.modelInfo$,
        this.experimentKey$,
        this.experimentInfo$,
        this.store.select(selectCurrentArtifactExperimentId)
      ])
        .pipe(
          debounceTime(0),
          distinctUntilChanged(),
          filter(([, modelInfo, experimentKey, experimentInfo, artifactsExperiment]) =>
            !!modelInfo && experimentInfo && experimentKey && artifactsExperiment === experimentKey))
        .subscribe(([selectedId, modelInfo]) => {
          const onOutputModel = this.route.snapshot.firstChild?.data?.outputModel;
          const onInputModel = this.route.snapshot.firstChild?.data?.outputModel === false;
          const taskName = this.route.snapshot.queryParams.taskName;
          if (selectedId) {
            const selectedArtifact = modelInfo.artifacts?.find(artifact => artifact.key === selectedId);
            const selectedInputModel = modelInfo.input?.find(model => model.id === selectedId && model.taskName === taskName);
            const selectedOutputModel = modelInfo.output?.find(model => model.id === selectedId);
            const onArtifact = !onInputModel && !onOutputModel;
            if ((onOutputModel && !selectedOutputModel) || (onInputModel && !selectedInputModel) || (onArtifact && !selectedArtifact)) {
              this.resetSelection(modelInfo);
            }
          } else {
            this.resetSelection(modelInfo);
          }
        })
    );
  }

  private navigateToTarget(target: string[]) {
    const targetStr = target.join('/');
    if (targetStr !== this.previousTarget || !this.route.firstChild) {
      this.previousTarget = targetStr;
      this.router.navigate(target, {relativeTo: this.route, queryParamsHandling: 'preserve', replaceUrl: true});
    }
  }

  private resetSelection(modelInfo): void {
    let target: string[];
    if (modelInfo.input?.length > 0) {
      target = ['..', 'artifacts', 'input-model', encodeURIComponent(modelInfo.input[0]?.id)];
    } else if (modelInfo.output?.length > 0) {
      target = ['..', 'artifacts', 'output-model', encodeURIComponent(modelInfo.output[0]?.id)];
    } else if (modelInfo.artifacts.length > 0) {
      target = ['..', 'artifacts', 'other', encodeURIComponent(modelInfo.artifacts[0]?.key), encodeURIComponent(modelInfo.artifacts[0]?.mode)];
    } else {
      // no items
      target = ['..', 'artifacts', 'input-model', 'input-model'];
    }
    this.navigateToTarget(target);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

}
