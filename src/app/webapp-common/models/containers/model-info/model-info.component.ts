import {ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {selectRouterConfig, selectRouterParams} from '@common/core/reducers/router-reducer';
import {Store} from '@ngrx/store';
import * as infoActions from '../../actions/models-info.actions';
import {selectIsModelInEditMode, selectSelectedModel, selectSelectedTableModel, selectSplitSize} from '../../reducers';
import {SelectedModel} from '../../shared/models.model';
import {Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, withLatestFrom} from 'rxjs/operators';
import {addMessage, setAutoRefresh} from '@common/core/actions/layout.actions';
import {selectBackdropActive} from '@common/core/reducers/view.reducer';
import {setTableMode} from '@common/models/actions/models-view.actions';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {MESSAGES_SEVERITY} from '@common/constants';
import {
  groupByCharts,
  GroupByCharts, removeExperimentSettings,
  setExperimentSettings,
  toggleMetricValuesView,
  toggleSettings
} from '@common/experiments/actions/common-experiment-output.actions';
import {
  selectIsSharedAndNotOwner,
  selectSelectedModelSettings,
} from '~/features/experiments/reducers';
import {RefreshService} from '@common/core/services/refresh.service';
import {getCompanyTags, setBreadcrumbsOptions, setSelectedProject} from '@common/core/actions/projects.actions';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {ALL_PROJECTS_OBJECT} from '@common/core/effects/projects.effects';
import {ModelsInfoEffects} from '@common/models/effects/models-info.effects';
import {headerActions} from '@common/core/actions/router.actions';
import {
  selectMetricValuesView,
  selectModelSettingsGroupBy, selectModelSettingsHiddenScalar, selectModelSettingsShowOrigin,
  selectModelSettingsSmoothSigma, selectModelSettingsSmoothType,
  selectModelSettingsSmoothWeight,
  selectModelSettingsXAxisType, selectSelectedModelSettingsIsProjectLevel
} from '@common/experiments/reducers';
import {smoothTypeEnum, SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {concatLatestFrom} from '@ngrx/operators';
import {infoModelsTabsLinks} from '@common/models/models.consts';

@Component({
  selector: 'sm-model-info',
  templateUrl: './model-info.component.html',
  styleUrls: ['./model-info.component.scss'],
  standalone: false
})
export class ModelInfoComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private refresh = inject(RefreshService);
  private cdr = inject(ChangeDetectorRef);
  private modelInfoEffect = inject(ModelsInfoEffects);
  public minimized: boolean;

  public selectedModel: SelectedModel;
  private sub = new Subscription();
  public isExample: boolean;
  protected smoothWeight = this.store.selectSignal(selectModelSettingsSmoothWeight);
  protected smoothSigma = this.store.selectSignal(selectModelSettingsSmoothSigma);
  protected smoothType = this.store.selectSignal(selectModelSettingsSmoothType);
  protected xAxisType = this.store.selectSignal(selectModelSettingsXAxisType);
  protected groupBy = this.store.selectSignal(selectModelSettingsGroupBy);
  protected listOfHidden = this.store.selectSignal(selectModelSettingsHiddenScalar);
  protected showOriginals = this.store.selectSignal(selectModelSettingsShowOrigin);



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


  links = infoModelsTabsLinks;
  public toMaximize: boolean;
  private modelsFeature: boolean;

  protected selectedModel$ = this.store.select(selectSelectedModel)
    .pipe(filter(model => !!model));
  protected routerConfig = this.store.selectSignal(selectRouterConfig);
  protected routerParams = this.store.selectSignal(selectRouterParams);
  protected backdropActive$ = this.store.select(selectBackdropActive);
  protected selectedTableModel$ = this.store.select(selectSelectedTableModel);
  protected splitSize$ = this.store.select(selectSplitSize);
  protected isSharedAndNotOwner$ = this.store.select((selectIsSharedAndNotOwner));
  protected isModelInEditMode$ = this.store.select(selectIsModelInEditMode);
  protected selectedProject$ = this.store.select(selectSelectedProject);
  protected metricValuesView$ = this.store.select(selectMetricValuesView);
  private allSettings = this.store.selectSignal(selectSelectedModelSettings);
  protected isProjectLevel = this.store.selectSignal(selectSelectedModelSettingsIsProjectLevel);

  projectId = computed(() => this.routerParams().projectId);

  constructor() {
    this.modelsFeature = this.route.snapshot.data?.setAllProject;
    if (this.modelsFeature) {
      this.store.dispatch(setSelectedProject({project: ALL_PROJECTS_OBJECT}));
      this.store.dispatch(getCompanyTags());
    }
    this.minimized = this.route.snapshot.firstChild?.data.minimized;
    if (!this.minimized) {
      this.store.dispatch(headerActions.reset());
      this.setupBreadcrumbsOptions();
    }
  }

  ngOnInit() {
    this.sub.add(this.store.select(selectSelectedModel)
      .subscribe(model => {
        this.selectedModel = model;
        this.isExample = isReadOnly(model);
        this.cdr.detectChanges();
      })
    );

    this.sub.add(this.store.select(selectRouterParams)
      .pipe(
        debounceTime(150),
        map(params => params?.modelId),
        filter(modelId => !!modelId),
        distinctUntilChanged()
      )
      .subscribe(id => this.store.dispatch(infoActions.getModelInfo({id})))
    );

    this.sub.add(this.refresh.tick
      .pipe(
        withLatestFrom(this.isModelInEditMode$),
        filter(([, isModelInEditMode]) => !isModelInEditMode && !this.minimized)
      ).subscribe(([auto]) => {
        if (auto === null) {
          this.store.dispatch(infoActions.refreshModelInfo(this.selectedModel.id));
        } else {
          this.store.dispatch(infoActions.getModelInfo({id: this.selectedModel.id}));
        }
      })
    );

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (!this.toMaximize) {
      this.modelInfoEffect.previousSelectedId = null;
      this.modelInfoEffect.previousSelectedLastUpdate = null;
      this.store.dispatch(infoActions.setModelInfo({model: null}));
    }
  }

  public updateModelName(name: string) {
    if (name.trim().length > 2) {
      this.store.dispatch(infoActions.updateModelDetails({id: this.selectedModel.id, changes: {name}}));
    } else {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, 'Name must be more than three letters long'));
    }
  }

  public getReadyStatus(ready) {
    if (ready === null) {
      return null;
    }
    return ready ? 'published' : 'created';
  }

  toggleSettingsBar() {
    this.store.dispatch(toggleSettings());
  }

  closePanel() {
    this.store.dispatch(setTableMode({mode: 'table'}));
    return this.router.navigate(['..'], {relativeTo: this.route, queryParamsHandling: 'merge'});
  }

  maximize() {
    const last = this.route.snapshot.firstChild.url[0].path;
    this.store.dispatch(headerActions.reset());
    return this.router.navigate(['output', last], {relativeTo: this.route, queryParamsHandling: 'preserve'});
  }

  minimizeView() {
    const last = this.route.snapshot.firstChild.url[0].path;
    return this.router.navigate(['..', last], {relativeTo: this.route, queryParamsHandling: 'preserve'});
  }

  setAutoRefresh($event: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh: $event}));
  }

  setupBreadcrumbsOptions() {
    this.sub.add(this.selectedProject$.pipe(concatLatestFrom(() => [this.store.select(selectRouterParams), this.store.select(selectRouterConfig)])
    ).subscribe(([selectedProject, params, config]) => {
      if (this.modelsFeature) {
        this.store.dispatch(setBreadcrumbsOptions({
          breadcrumbOptions: {
            showProjects: false,
            featureBreadcrumb: {name: 'Models'},
          }
        }));
      } else {
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
              ...(selectedProject && {
                selectedProjectBreadcrumb: {
                  name: selectedProject?.id === '*' ? 'All Models' : selectedProject?.basename,
                  url: this.getMinimizeURL(params, config), queryParamsHandling: 'preserve', linkLast: true
                }
              })
            }
          }
        }));
      }
    }));
  }

  getMinimizeURL(params, config): string {
    return  config.map(item => {
      switch (item) {
        case ':projectId':
          return params.projectId;
        case ':modelId':
          return params.modelId;
          default:
            return item
      }
    }).filter(item => item!=='output').join('/');
  }

  toggleTableView() {
    this.store.dispatch(toggleMetricValuesView());
  }

  changeSmoothness($event: number) {
    this.store.dispatch(setExperimentSettings({
      id: this.selectedModel.id,
      changes: {...this.getSettingsObject(), smoothWeight: $event}
    }));
  }

  changeSigma($event: number) {
    this.store.dispatch(setExperimentSettings({
      id: this.selectedModel.id,
      changes: {...this.getSettingsObject(), smoothSigma: $event}
    }));
  }

  changeSmoothType($event: SmoothTypeEnum) {
    this.store.dispatch(setExperimentSettings({
      id: this.selectedModel.id,
      changes: {...this.getSettingsObject(), smoothType: $event}
    }));
  }

  changeXAxisType($event: ScalarKeyEnum) {
    this.store.dispatch(setExperimentSettings({
      id: this.selectedModel.id,
      changes: {...this.getSettingsObject(), xAxisType: $event}
    }));
  }

  changeGroupBy($event: GroupByCharts) {
    this.store.dispatch(setExperimentSettings({
      id: this.selectedModel.id,
      changes: {...this.getSettingsObject(), groupBy: $event}
    }));
  }

  changeShowOriginals($event: boolean) {
    this.store.dispatch(setExperimentSettings({id: this.selectedModel.id, changes: {...this.getSettingsObject(), showOriginals: $event}}));
  }

  getSettingsObject = () => ({
    ...(this.groupBy() && {groupBy: this.groupBy()}),
    ...(this.showOriginals() !== undefined && {showOriginals: this.showOriginals()}),
    ...(this.xAxisType() && {xAxisType: this.xAxisType()}),
    ...(this.smoothType() && {smoothType: this.smoothType()}),
    ...(this.smoothWeight() && {smoothWeight: this.smoothWeight()}),
    ...(this.smoothSigma() && {smoothSigma: this.smoothType() === smoothTypeEnum.gaussian ? this.smoothSigma() : 2}),
    ...(this.listOfHidden() && {hiddenMetricsScalar: this.listOfHidden()}),
    ...(this.showOriginals() !== undefined && {showOriginals: this.showOriginals()}),
    projectLevel: false
  });

  setToProject() {
    this.store.dispatch(setExperimentSettings({
      changes: {
        ...this.allSettings(),
        id: this.projectId(),
        projectLevel: true
      }, id: this.projectId()
    }));
    this.store.dispatch(removeExperimentSettings({id: this.selectedModel.id}));
  }

}

