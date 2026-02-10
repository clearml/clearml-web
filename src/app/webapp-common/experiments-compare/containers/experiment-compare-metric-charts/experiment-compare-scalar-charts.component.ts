import {ChangeDetectorRef, Component, effect, HostListener, OnDestroy, OnInit, ViewChild, inject, signal} from '@angular/core';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {distinctUntilChanged, filter, take, withLatestFrom} from 'rxjs/operators';
import {isEqual} from 'lodash-es';
import {
  createMultiSingleValuesChart,
  createMultiSingleValuesMultiChart,
  mergeMultiMetrics,
  mergeMultiMetricsGroupedVariant
} from '@common/tasks/tasks.utils';
import {
  getMultiScalarCharts,
  getMultiSingleScalars,
  resetExperimentMetrics, setExperimentHistogram,
  setExperimentMetricsSearchTerm, setExperimentMultiScalarSingleValue,
  setExperimentSettings,
  setSelectedExperiments
} from '../../actions/experiments-compare-charts.actions';
import {
  selectCompareTasksScalarCharts, selectExperimentMetricsSearchTerm,
  selectMultiSingleValues,
  selectSelectedExperiments,
  selectSelectedExperimentSettings
} from '../../reducers';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {GroupByCharts, groupByCharts, setChartSettings} from '@common/experiments/actions/common-experiment-output.actions';
import {ExtFrame} from '@common/shared/single-graph/plotly-graph-base';
import {RefreshService} from '@common/core/services/refresh.service';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {ExperimentGraphsComponent} from '@common/shared/experiment-graphs/experiment-graphs.component';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {ActivatedRoute} from '@angular/router';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {smoothTypeEnum, SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {ExperimentCompareSettings} from '@common/experiments-compare/reducers/experiments-compare-charts.reducer';
import {
  selectCompareSelectedMetrics,
  selectMetricVariants,
  selectShowCompareScalarSettings,
  selectSplitSize
} from '@common/experiments/reducers';
import {
  getCustomMetricsPerType,
  toggleCompareScalarSettings
} from '@common/experiments/actions/common-experiments-view.actions';
import {MetricVariants} from '~/business-logic/model/events/metricVariants';
import {GroupedList} from '@common/tasks/tasks.model';
import {
  buildMetricsList,
  SelectableGroupedFilterListComponent
} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {EventTypeEnum} from '~/business-logic/model/events/eventTypeEnum';
import {MatSidenavModule} from '@angular/material/sidenav';
import {PushPipe} from '@ngrx/component';
import {GraphSettingsBarComponent} from '@common/shared/experiment-graphs/graph-settings-bar/graph-settings-bar.component';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {ExperimentSettings} from '@common/experiments/reducers/experiment-output.reducer';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';


@Component({
  selector: 'sm-experiment-compare-scalar-charts',
  templateUrl: './experiment-compare-scalar-charts.component.html',
  styleUrls: ['./experiment-compare-scalar-charts.component.scss'],
  imports: [
    MatSidenavModule,
    SingleGraphStateModule,
    SelectableGroupedFilterListComponent,
    PushPipe,
    GraphSettingsBarComponent,
    MatMenu,
    MatMenuTrigger,
    ClickStopPropagationDirective,
    ExperimentGraphsComponent
  ]
})
export class ExperimentCompareScalarChartsComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly changeDetection = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly refresh = inject(RefreshService);
  private readonly reportEmbed = inject(ReportCodeEmbedService);

  protected metrics$ = this.store.select(selectCompareTasksScalarCharts)
    .pipe(
      filter(metrics => !!metrics),
      distinctUntilChanged()
    );
  protected settings$ = this.store.select(selectSelectedExperimentSettings);
  protected splitSize$ = this.store.select(selectSplitSize);
  protected singleValues$ = this.store.select(selectMultiSingleValues);
  protected routerParams$ = this.store.select(selectRouterParams).pipe(
    filter(params => params.ids !== undefined),
    distinctUntilChanged()
  );
  protected showSettingsBar = this.store.selectSignal(selectShowCompareScalarSettings);
  protected projectId = this.store.selectSignal<string>(selectRouterProjectId);
  public searchTerm$: Observable<string>;

  private subs = new Subscription();

  public graphList: GroupedList = {};
  private taskIds: string[];
  public graphs: Record<string, ExtFrame[]>;
  private metrics: GroupedList;
  groupByOptions = [
    {
      name: 'Metric',
      value: groupByCharts.metric
    },
    {
      name: 'Metric + Variant',
      value: groupByCharts.none
    }
  ];

  @ViewChild(ExperimentGraphsComponent) graphsComponent: ExperimentGraphsComponent;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  private entityType: EntityTypeEnum;
  public modelsFeature: boolean;
  public singleValuesChart: ExtFrame;
  public singleValuesSplit: ExtFrame[];
  public settings: ExperimentCompareSettings = {} as ExperimentCompareSettings;
  private initialSettings = {
    groupBy: 'none',
    smoothWeight: 0,
    smoothSigma: 2,
    smoothType: smoothTypeEnum.exponential,
    xAxisType: ScalarKeyEnum.Iter,
    selectedMetricsScalar: [],
    showOriginals: true
  };
  private originalSettings: ExperimentCompareSettings;
  public minimized = false;
  private selectedVariants: MetricVariants[];
  private originMetrics: MetricVariantResult[];
  private previousTaskIds: string[];
  private firstTime = true;
  private previousSelectedMetricsCols: MetricVariantResult[] = [];
  protected loading = signal(false);

  @HostListener('window:beforeunload', ['$event']) unloadHandler() {
    this.saveSettingsState();
  }

  constructor() {
    this.modelsFeature = this.route.snapshot?.parent.data?.setAllProject;
    this.searchTerm$ = this.store.select(selectExperimentMetricsSearchTerm);

    effect(() => {
      if (this.showSettingsBar()) {
        this.trigger.openMenu();
      }
    });
  }

  ngOnInit() {
    this.minimized = this.route.snapshot.routeConfig.data?.minimized;
    this.entityType = this.route.snapshot.parent.parent.data.entityType;

    this.subs.add(combineLatest([this.metrics$, this.singleValues$])
      .subscribe(([metricsWrapped, singleValues]) => {
        this.graphs = {}; // Do we want to reset graphs between changes
        const metrics = metricsWrapped?.metrics || {};
        if (singleValues) {
          const visibles = this.graphsComponent?.singleValueGraph().at(0)?.chart.data.reduce((curr, data) => {
            curr[data.task] = data.visible;
            return curr;
          }, {}) ?? {};
          if (this.settings.groupBy === 'metric') {
            this.singleValuesChart = createMultiSingleValuesChart(singleValues, visibles);
          } else {
            this.singleValuesChart = null;
            this.singleValuesSplit = createMultiSingleValuesMultiChart(singleValues);
          }
        }
        this.metrics = metrics;
        this.prepareGraphsAndUpdate(metrics, this.singleValuesSplit);
      }));

    this.subs.add(this.routerParams$
      .pipe(withLatestFrom(
        this.store.select(selectMetricVariants),
        this.store.select(selectSelectedExperiments)))
      .subscribe(([params, metrics, selectedExperiments]) => {
        if (!this.taskIds || this.taskIds.join(',') !== params.ids) {
          const previousTaskIds = this.taskIds;
          this.taskIds = params.ids.split(',').sort().filter(id => !!id);
          this.store.dispatch(setSelectedExperiments({selectedExperiments: this.taskIds}));
          if ((metrics === null || metrics.length === 0 || (metrics.length > 0 && previousTaskIds !== undefined) || !isEqual(selectedExperiments, this.taskIds))) {
            this.store.dispatch(getCustomMetricsPerType({ids: this.taskIds, metricsType: EventTypeEnum.TrainingStatsScalar, isModel: this.entityType === EntityTypeEnum.model}));

          }
        }
      }));

    this.subs.add(this.store.select(selectCompareSelectedMetrics('scalars'))
      .pipe(
        filter(metrics => !!metrics && this.minimized),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr)))
      .subscribe(selectedMetrics => {
        const metricsVariants = selectedMetrics.filter(m => !m.hidden).reduce((acc, curr) => {
          const currMetric = curr.metricName.replace(' Summary', 'Summary');
          if (acc[currMetric]) {
            acc[currMetric].push(curr.variantName);
          } else {
            acc[currMetric] = [curr.variantName];
          }
          return acc;
        }, {} as Record<string, string[]>);

        const newSelectedMetricsScalar = selectedMetrics.filter(m => !m.hidden).map(m => m.metricName + m.variantName);
        const VariantWasAdded = newSelectedMetricsScalar?.length > this.settings.selectedMetricsScalar?.length;
        this.settings.selectedMetricsScalar = newSelectedMetricsScalar;
        const variants = Object.entries(metricsVariants).map(([metricName, variants]) => ({metric: metricName, variants}));
        this.selectedVariants = variants;
        if (variants.length > 0 && this.taskIds.length > 0) {
          if (this.firstTime || VariantWasAdded && this.missingVariantGraphInStore()) {
            this.firstTime = false;
            this.store.dispatch(getMultiScalarCharts({taskIds: this.taskIds, entity: this.entityType, metrics: variants, xAxisType: this.settings.xAxisType}));
          }
          this.store.dispatch(getMultiSingleScalars({taskIds: this.taskIds, entity: this.entityType, metrics: variants}));
        }
      }));

    this.subs.add(this.refresh.tick
      .pipe(filter(auto => auto !== null && this.graphs !== null && this.taskIds.length > 0))
      .subscribe(autoRefresh => {
        this.store.dispatch(getCustomMetricsPerType({ids: this.taskIds, metricsType: EventTypeEnum.TrainingStatsScalar, isModel: this.entityType === EntityTypeEnum.model}));
        this.store.dispatch(getMultiScalarCharts({taskIds: this.taskIds, entity: this.entityType, metrics: this.selectedVariants, xAxisType: this.settings.xAxisType}));
        this.store.dispatch(getMultiSingleScalars({taskIds: this.taskIds, entity: this.entityType, metrics: this.selectedVariants, autoRefresh}));
      }));

    this.subs.add(this.settings$.pipe(take(1)).subscribe(settings => {
      this.originalSettings = settings;
      this.settings = settings ? {...this.initialSettings, ...settings, ...(this.settings ?? {})} : {...this.initialSettings, ...(this.settings ?? {})} as ExperimentCompareSettings;
    }));

    this.subs.add(this.store.select(selectMetricVariants)
      .pipe(
        filter(metrics => !!metrics),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr) && this.taskIds === this.previousTaskIds)
      )
      .subscribe(metrics => {
        this.previousTaskIds = this.taskIds;
        this.originMetrics = metrics;
        this.graphList = buildMetricsList(metrics);

        if (!this.minimized) {
          let selectedMetricsCols: MetricVariantResult[];
          if (this.settings.selectedMetricsScalar?.length > 0) {
            selectedMetricsCols = this.settings.groupBy === groupByCharts.none ?
              metrics.filter(metric => this.settings.selectedMetricsScalar.includes(metric.metric + metric.variant)) :
              metrics.filter(metric => this.settings.selectedMetricsScalar.includes(metric.metric) || this.settings.selectedMetricsScalar.includes(metric.metric + metric.variant));
            if (this.settings.groupBy === 'none') {
              this.settings = this.selectAllChildren();
            }
            this.settings.selectedMetricsScalar = Array.from(new Set([
              ...this.settings.selectedMetricsScalar,
              ...selectedMetricsCols.map(metric => metric.metric)
            ]));
          } else {
            if (this.settings.groupBy === 'metric') {
              const uniqueMetrics = Array.from(new Set(metrics.map(a => a.metric)));
              const FifthMetric = uniqueMetrics[8] ?? uniqueMetrics.at(-1);
              selectedMetricsCols = metrics.slice(0, metrics.findIndex(metric => metric.metric === FifthMetric) ?? 8);
            } else {
              selectedMetricsCols = metrics.slice(0, 8);
            }
            this.settings.selectedMetricsScalar = [
              ...selectedMetricsCols.map(metric => metric.metric + metric.variant),
              ...Array.from(new Set(selectedMetricsCols.map(metric => metric.metric)))
            ];
          }
          this.selectedVariants = this.buildMetricVariants(selectedMetricsCols);
        }
        if (this.taskIds.length > 0) {
          this.store.dispatch(getMultiScalarCharts({taskIds: this.taskIds, entity: this.entityType, metrics: this.selectedVariants, xAxisType: this.settings.xAxisType}));
          this.store.dispatch(getMultiSingleScalars({taskIds: this.taskIds, entity: this.entityType, metrics: this.selectedVariants}));
        }
        if (this.selectedVariants?.length === 0) {
          this.store.dispatch(setExperimentHistogram({axisType: this.settings.xAxisType, payload: {}}));
          this.store.dispatch(setExperimentMultiScalarSingleValue({name: null}));
          this.singleValuesChart = null;
          this.singleValuesSplit = [];
          this.graphs = {};
        }
        this.changeDetection.markForCheck();
      }));

  }

  buildMetricVariants = (selectedMetricsCols: MetricVariantResult[]) => {
    const selectedMetricsVariants = selectedMetricsCols.reduce((acc, curr) => {
      const currMetric = curr.metric.replace(' Summary', 'Summary');
      if (this.settings.groupBy === 'metric') {
        acc[currMetric] = [];
      } else {
        if (acc[currMetric]) {
          acc[currMetric].push(curr.variant);
        } else {
          acc[currMetric] = [curr.variant];
        }
      }
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(selectedMetricsVariants).map(([metricName, variants]) => ({metric: metricName, variants}));
  };

  private prepareGraphsAndUpdate(metrics, singleValues) {
    this.loading.set(false);
    if (metrics || singleValues) {
      let merged = {};
      if (metrics || singleValues) {
        merged = this.settings.groupBy === 'metric' ? mergeMultiMetricsGroupedVariant(metrics) : {...mergeMultiMetrics(metrics), ...(singleValues?.length > 0 && {' Summary': singleValues})};
      }
      // this.graphList = {...(this.settings.groupBy === 'metric' ? this.buildNestedListWithoutChildren(merged) : metrics), ...(singleValues?.data.length > 0 && {[singleValueChartTitle]: {}})};
      if (!this.graphs || !isEqual(merged, this.graphs)) {
        this.graphs = merged;
      }
      this.changeDetection.detectChanges();
    }
  }

  private buildNestedListWithoutChildren(metricsList: MetricVariantResult[]) {
    return metricsList.reduce((acc, metric) => {
      acc[metric.metric] = {};
      return acc;
    }, {} as GroupedList);
  }

  // private buildNestedListWithoutChildren(merged: { [p: string]: ExtFrame[] }) {
  //   return Object.keys(merged).reduce((acc, metric) => {
  //     acc[metric] = {};
  //     return acc;
  //   }, {});
  // }

  ngOnDestroy() {
    this.store.dispatch(setExperimentMetricsSearchTerm({searchTerm: ''}));
    this.saveSettingsState();
    this.subs.unsubscribe();
    this.resetMetrics();
  }

  metricSelected(id) {
    this.graphsComponent.scrollToGraph(id);
  }

  selectedListChanged(selectedList: string[]) {
    if (isEqual(selectedList, this.settings.selectedMetricsScalar)) {
      return;
    }
    this.settings = {...this.settings, selectedMetricsScalar: selectedList ?? []};
    if (!this.minimized) {
      const selectedMetricsCols = this.settings.groupBy === groupByCharts.none ?
        this.originMetrics.filter(metric => this.settings.selectedMetricsScalar.includes(metric.metric + metric.variant)) :
        this.originMetrics.filter(metric => this.settings.selectedMetricsScalar.includes(metric.metric));
      const newSelectedVariants = this.buildMetricVariants(selectedMetricsCols);
      const isAdded = selectedMetricsCols.length > this.previousSelectedMetricsCols.length ||
        selectedMetricsCols.filter(m => m.metric === ' Summary').length !== this.previousSelectedMetricsCols.filter(m => m.metric === ' Summary').length;
      this.selectedVariants = newSelectedVariants;
      if (this.settings.groupBy === groupByCharts.metric) {
        this.cleanVariantsWithoutMetric(selectedMetricsCols);
      }
      if (this.selectedVariants.length > 0) {
        // We don't need to fetch when hiding charts
        if (isAdded && this.taskIds.length > 0) {
          this.store.dispatch(getMultiScalarCharts({taskIds: this.taskIds, entity: this.entityType, metrics: this.selectedVariants, xAxisType: this.settings.xAxisType}));
          this.store.dispatch(getMultiSingleScalars({taskIds: this.taskIds, entity: this.entityType, metrics: this.selectedVariants}));
        }
      } else {
        this.settings = {...this.settings, selectedMetricsScalar: []};
      }
      this.previousSelectedMetricsCols = selectedMetricsCols;
    }
  }

  cleanVariantsWithoutMetric(selectedMetricsCols: MetricVariantResult[]) {
    const allRealVariants = selectedMetricsCols.map(metric => [`${metric.metric}${metric.variant}`, metric.metric]).flat(2);
    this.settings.selectedMetricsScalar = this.settings.selectedMetricsScalar.filter(m => allRealVariants.includes(m));
  }

  searchTermChanged(searchTerm: string) {
    this.store.dispatch(setExperimentMetricsSearchTerm({searchTerm}));
  }

  resetMetrics() {
    this.store.dispatch(resetExperimentMetrics());
  }

  changeSmoothness($event: number) {
    this.settings = {...this.settings, smoothWeight: $event};
  }

  changeSigma($event: number) {
    this.settings = {...this.settings, smoothSigma: $event};
  }


  changeSmoothType($event: SmoothTypeEnum) {
    this.settings = {
      ...this.settings, smoothType: $event,
      ...(this.settings.smoothType !== smoothTypeEnum.gaussian && {smoothSigma: 2})
    };
  }

  changeShowOriginals($event: boolean) {
    this.settings = {...this.settings, showOriginals: $event};
  }

  changeXAxisType($event: ScalarKeyEnum) {
    this.settings = {...this.settings, xAxisType: $event};
    if (this.taskIds.length > 0) {
      this.store.dispatch(getMultiScalarCharts({taskIds: this.taskIds, entity: this.entityType, metrics: this.selectedVariants, xAxisType: this.settings.xAxisType}));
    }
  }

  changeGroupBy(groupBy: GroupByCharts) {
    this.settings = {...this.settings, groupBy};
    if (groupBy === 'none') {
      this.loading.set(true);
    } else {
      this.prepareGraphsAndUpdate(this.metrics, this.singleValuesSplit);
    }
    this.graphList = buildMetricsList(this.originMetrics);
    const selectedMetricsWithoutVariants = this.selectedVariants.map(metric => ({metric: metric.metric, variants: []}));
    if (groupBy === 'none') {
      this.settings = this.selectAllChildren();
    }
    if (this.taskIds.length > 0) {
    this.store.dispatch(getMultiScalarCharts({
      taskIds: this.taskIds,
      entity: this.entityType,
      metrics: this.settings.groupBy === 'none' ? this.selectedVariants : selectedMetricsWithoutVariants,
      xAxisType: this.settings.xAxisType
    }));
    this.store.dispatch(getMultiSingleScalars({
      taskIds: this.taskIds,
      entity: this.entityType,
      metrics: this.settings.groupBy === 'none' ? this.selectedVariants : selectedMetricsWithoutVariants
    }));
    }
  }

  changeChartSettings($event: { id: string; changes: Partial<ExperimentSettings> }) {
    this.store.dispatch(setChartSettings({...$event, projectId: this.projectId()}));
  }

  selectAllChildren(force = false) {
    const newVariantsToSelect = [];
    Object.entries(this.graphList).forEach(([metric, variant]) => {
      if (this.settings.selectedMetricsScalar.includes(metric) && (this.settings.selectedMetricsScalar.filter(a => a.startsWith(metric)).length === 1 || force)) {
        Object.keys(variant).map(variantName => metric + variantName).forEach(variantPath => {
          if (!this.settings.selectedMetricsScalar.includes(variantPath)) {
            newVariantsToSelect.push(variantPath);
          }
        });
      }
    });
    return {...this.settings, selectedMetricsScalar: [...this.settings.selectedMetricsScalar, ...newVariantsToSelect]};
  }

  toggleSettingsBar() {
    this.store.dispatch(toggleCompareScalarSettings());
  }

  // hoverModeChanged(hoverMode: ChartHoverModeEnum) {
  //   this.store.dispatch(setScalarsHoverMode({hoverMode}));
  // }

  createEmbedCode(event: { metrics?: string[]; variants?: string[]; domRect: DOMRect; singleValues?: boolean }) {
    const entityType = this.entityType === EntityTypeEnum.model ? 'model' : 'task';
    this.reportEmbed.createCode({
      type: (event.singleValues || !event.metrics) ? 'single' : 'scalar',
      objects: (!!event.metrics || this.taskIds.length > 1) ? this.taskIds : [...this.taskIds, ''],
      objectType: entityType,
      ...event
    });
  }

  private saveSettingsState() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {id, lastModified, selectedMetricsPlot, ...cleanSettings} = this.settings;
    if (!isEqual(cleanSettings, this.originalSettings)) {
      this.store.dispatch(setExperimentSettings({id: this.taskIds, changes: cleanSettings}));
    }
  }

  private missingVariantGraphInStore() {
    const graphs = this.graphs ? Object.keys(this.graphs) : [];
    return this.settings.selectedMetricsScalar.filter(metric => !metric.startsWith(' Summary')).some(graph => !graphs.includes(graph));
  }
}
