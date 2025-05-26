import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {selectRouterConfig, selectRouterParams} from '@common/core/reducers/router-reducer';
import {Store} from '@ngrx/store';
import {interval, Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {debounce, distinctUntilChanged, filter, map, tap, withLatestFrom} from 'rxjs/operators';
import {Project} from '~/business-logic/model/projects/project';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {
  selectExperimentInfoData,
  selectIsSharedAndNotOwner,
  selectSelectedExperiment
} from '~/features/experiments/reducers';
import {
  groupByCharts,
  GroupByCharts,
  removeExperimentSettings,
  resetExperimentMetrics,
  setExperimentSettings,
  toggleMetricValuesView,
  toggleSettings
} from '../../actions/common-experiment-output.actions';
import * as infoActions from '../../actions/common-experiments-info.actions';
import {experimentDetailsUpdated} from '../../actions/common-experiments-info.actions';
import {selectBackdropActive} from '@common/core/reducers/view.reducer';
import {addMessage, setAutoRefresh} from '@common/core/actions/layout.actions';
import {
  selectIsExperimentInEditMode,
  selectMetricValuesView,
  selectSelectedExperiments, selectSelectedExperimentSettings,
  selectSelectedSettingsGroupBy, selectSelectedSettingsHiddenScalar, selectSelectedSettingsIsProjectLevel, selectSelectedSettingsSmoothSigma,
  selectSelectedSettingsSmoothType,
  selectSelectedSettingsSmoothWeight,
  selectSelectedSettingsxAxisType,
  selectSplitSize
} from '../../reducers';
import {RefreshService} from '@common/core/services/refresh.service';
import {isDevelopment} from '~/features/experiments/shared/experiments.utils';
import * as experimentsActions from '../../actions/common-experiments-view.actions';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {MESSAGES_SEVERITY} from '@common/constants';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {headerActions} from '@common/core/actions/router.actions';
import {smoothTypeEnum, SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {toSignal} from '@angular/core/rxjs-interop';
import {concatLatestFrom} from '@ngrx/operators';

@Component({
  selector: 'sm-base-experiment-output',
  template: '',
  standalone: false
})
export abstract class BaseExperimentOutputComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private refresh = inject(RefreshService);

  public selectedExperiment: IExperimentInfo;
  private subs = new Subscription();
  public minimized: boolean;
  protected projectId: Project['id'];
  public experimentId: string;
  public routerConfig: string[];
  public isExample: boolean;
  public isDevelopment: boolean;
  protected infoData$ = this.store.select(selectExperimentInfoData);
  protected isSharedAndNotOwner$ = this.store.select((selectIsSharedAndNotOwner));
  protected isExperimentInEditMode$ = this.store.select(selectIsExperimentInEditMode);
  protected backdropActive$ = this.store.select(selectBackdropActive);
  protected selectSplitSize$ = this.store.select(selectSplitSize);
  protected selectedProject$ = this.store.select(selectSelectedProject);
  protected metricValuesView$ = this.store.select(selectMetricValuesView);
  protected smoothWeight = toSignal(this.store.select(selectSelectedSettingsSmoothWeight).pipe(filter(smooth => smooth !== null)));
  protected smoothSigma = toSignal(this.store.select(selectSelectedSettingsSmoothSigma).pipe(filter(sigma => sigma !== null)));
  protected smoothType = this.store.selectSignal(selectSelectedSettingsSmoothType);
  protected xAxisType = this.store.selectSignal(selectSelectedSettingsxAxisType(false));
  protected allSettings = this.store.selectSignal(selectSelectedExperimentSettings());
  protected isProjectLevel = this.store.selectSignal(selectSelectedSettingsIsProjectLevel);
  protected groupBy = this.store.selectSignal(selectSelectedSettingsGroupBy);
  protected listOfHidden = this.store.selectSignal(selectSelectedSettingsHiddenScalar());

  groupByOptions = [
    {
      name: 'Metric',
      value: groupByCharts.metric
    },
    {
      name: 'None',
      value: groupByCharts.none
    }
  ];

  ngOnInit() {
    this.subs.add(this.store.select(selectRouterConfig).subscribe(routerConfig => {
      this.minimized = !routerConfig.includes('output');
      if (!this.minimized) {
        this.setupBreadcrumbsOptions();
      }
      this.routerConfig = routerConfig;
    }));

    this.subs.add(this.store.select(selectRouterParams)
      .pipe(
        tap((params) => this.projectId = params.projectId),
        map(params => params?.experimentId),
        filter(experimentId => !!experimentId),
        tap((experimentId) => this.experimentId = experimentId),
        distinctUntilChanged(),
        withLatestFrom(this.store.select(selectSelectedExperiments))
      ).subscribe(([experimentId, selectedExperiments]) => {
        this.selectedExperiment = selectedExperiments.find(experiment => experiment.id === experimentId) as unknown as IExperimentInfo;
        this.isExample = isReadOnly(this.selectedExperiment);
        this.isDevelopment = isDevelopment(this.selectedExperiment);
        this.store.dispatch(resetExperimentMetrics());
        this.store.dispatch(infoActions.resetExperimentInfo());
        this.store.dispatch(infoActions.getExperimentInfo({id: experimentId}));
      })
    );

    this.subs.add(this.refresh.tick
      .pipe(
        debounce(auto => auto === false ? interval(0) : interval(5000)), // Fix loop - getExperimentInfo trigger tick
        withLatestFrom(this.isExperimentInEditMode$),
        filter(([, isExperimentInEditMode]) => !isExperimentInEditMode && !this.minimized)
      ).subscribe(([auto]) => {
        if (auto === null) {
          this.store.dispatch(infoActions.autoRefreshExperimentInfo({id: this.experimentId}));
        } else {
          this.store.dispatch(infoActions.getExperimentInfo({id: this.experimentId, autoRefresh: auto}));
        }
      })
    );

    this.subs.add(this.store.select(selectSelectedExperiment)
      .pipe(filter(experiment => experiment?.id === this.experimentId))
      .subscribe(experiment => {
        this.selectedExperiment = experiment;
        this.isExample = isReadOnly(this.selectedExperiment);
        this.isDevelopment = isDevelopment(this.selectedExperiment);
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  setAutoRefresh($event: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh: $event}));
  }

  minimizeViewUrl(projectId: string, experimentId :string): string {
    const part = this.route?.firstChild.routeConfig.path;
    if (['log', 'metrics/scalar', 'metrics/plots', 'debugImages'].includes(part)) {
      return `projects/${projectId}/tasks/${experimentId}/info-output/${part}`;
    } else {
      return `projects/${projectId}/tasks/${experimentId}/${part}`
    }
  }

  minimizeView() {
    const part = this.route.firstChild.routeConfig.path;
    if (['log', 'metrics/scalar', 'metrics/plots', 'debugImages'].includes(part)) {
      this.router.navigateByUrl(`projects/${this.projectId}/experiments/${this.experimentId}/info-output/${part}`);
    } else {
      const parts = this.router ? this.router.url.split('/') : window.location.pathname.split('/');
      parts.splice(5, 1);
      this.router.navigateByUrl(parts.join('/'));
    }
  }

  toggleSettingsBar() {
    this.store.dispatch(toggleSettings());
  }

  toggleTableView() {
    this.store.dispatch(toggleMetricValuesView());
  }

  updateExperimentName(name) {
    if (name.trim().length > 2) {
      this.store.dispatch(experimentDetailsUpdated({id: this.selectedExperiment.id, changes: {name}}));
    } else {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, 'Name must be more than three letters long'));
    }
  }

  maximize() {
    if (window.location.pathname.includes('info-output')) {
      const resultsPath = this.route.firstChild?.firstChild?.routeConfig?.path || this.route.firstChild.routeConfig.path;
      this.router.navigateByUrl(`projects/${this.projectId}/experiments/${this.experimentId}/output/${resultsPath}`);
    } else {
      const parts = this.router.url.split('/');
      parts.splice(5, 0, 'output');
      this.router.navigateByUrl(parts.join('/'));
    }
    this.store.dispatch(headerActions.reset());
  }

  onActivate(e, scrollContainer) {
    scrollContainer.scrollTop = 0;
  }

  closePanel() {
    this.store.dispatch(experimentsActions.setTableMode({mode: 'table'}));
    return this.router.navigate(['..'], {relativeTo: this.route, queryParamsHandling: 'merge'});
  }

  setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe(concatLatestFrom(()=>[this.store.select(selectRouterParams)])
    ).subscribe(([selectedProject, params]) => {
      this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!selectedProject,
          featureBreadcrumb: {
            name: 'PROJECTS',
            url: 'projects'
          },
          projectsOptions: {
            basePath: 'projects',
            filterBaseNameWith: null,
            compareModule: null,
            showSelectedProject: selectedProject?.id !== '*',
            ...(selectedProject && {selectedProjectBreadcrumb: {name: selectedProject?.id === '*' ? 'All Tasks' : selectedProject?.basename,
                url: this.minimizeViewUrl(params.projectId, params.experimentId), queryParamsHandling: 'preserve', linkLast: true
              }})
          }
        }
      }));
    }));
  }

  changeSmoothness($event: number) {
    this.store.dispatch(setExperimentSettings({id: this.experimentId, changes: {...this.getSettingsObject(), smoothWeight: $event}}));
  }

  changeSigma($event: number) {
    this.store.dispatch(setExperimentSettings({id: this.experimentId, changes: {...this.getSettingsObject(), smoothSigma: $event}}));
  }

  changeSmoothType($event: SmoothTypeEnum) {
    this.store.dispatch(setExperimentSettings({id: this.experimentId, changes: {...this.getSettingsObject(), smoothType: $event}}));
  }

  changeXAxisType($event: ScalarKeyEnum) {
    this.store.dispatch(setExperimentSettings({id: this.experimentId, changes: {...this.getSettingsObject(), xAxisType: $event}}));
  }

  changeGroupBy($event: GroupByCharts) {
    this.store.dispatch(setExperimentSettings({id: this.experimentId, changes: {...this.getSettingsObject(), groupBy: $event}}));
  }

  getSettingsObject = () => ({
    ...(this.groupBy() && {groupBy: this.groupBy()}),
    ...(this.xAxisType() && {xAxisType: this.xAxisType()}),
    ...(this.smoothType() && {smoothType: this.smoothType()}),
    ...(this.smoothWeight() && {smoothWeight: this.smoothWeight()}),
    ...(this.smoothSigma() && {smoothSigma: this.smoothType() === smoothTypeEnum.gaussian ? this.smoothSigma() : 2}),
    ...(this.listOfHidden() && {hiddenMetricsScalar: this.listOfHidden()}),
    projectLevel: false
  });

  setToProject() {
    this.store.dispatch(setExperimentSettings({changes: {...this.allSettings(), id: this.projectId, projectLevel: true}, id: this.projectId}));
    this.store.dispatch(removeExperimentSettings({id: this.experimentId}));
  }

}
