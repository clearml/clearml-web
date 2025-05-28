import {ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {combineLatest, Observable, Subscription, take} from 'rxjs';
import {Store} from '@ngrx/store';
import {debounceTime, distinctUntilChanged, filter} from 'rxjs/operators';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {flatten, has, isArray, isEqual} from 'lodash-es';
import {setExperimentSettings, setSelectedExperiments} from '../../actions/experiments-compare-charts.actions';
import {
  selectCompareIdsFromRoute,
  selectHideIdenticalFields,
  selectScalarsGraphHyperParams,
  selectScalarsGraphMetrics,
  selectScalarsGraphMetricsResults,
  selectScalarsGraphTasks,
  selectScalarsMetricsHoverInfo,
  selectScalarsParamsHoverInfo,
  selectSelectedSettingsHyperParams,
  selectSelectedSettingsHyperParamsHoverInfo,
  selectSelectedSettingsMetric,
  selectSelectedSettingsMetrics,
  selectSelectedSettingsMetricsHoverInfo
} from '../../reducers';
import {
  getExperimentsHyperParams,
  setMetricsHoverInfo,
  setParamsHoverInfo,
  setShowIdenticalHyperParams
} from '../../actions/experiments-compare-scalars-graph.actions';
import {GroupedHyperParams, MetricOption} from '../../reducers/experiments-compare-charts.reducer';
import {selectPlotlyReady} from '@common/core/reducers/view.reducer';
import {ExtFrame} from '@common/shared/single-graph/plotly-graph-base';
import {RefreshService} from '@common/core/services/refresh.service';
import {MetricValueType, SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {ActivatedRoute, Router} from '@angular/router';
import {
  ExtraTask
} from '@common/experiments-compare/dumbs/parallel-coordinates-graph/parallel-coordinates-graph.component';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {
  SelectionEvent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {MetricVariantToPathPipe} from '@common/shared/pipes/metric-variant-to-path.pipe';


@Component({
    selector: 'sm-experiment-compare-hyper-params-graph',
    templateUrl: './experiment-compare-hyper-params-graph.component.html',
    styleUrls: ['./experiment-compare-hyper-params-graph.component.scss'],
    standalone: false
})
export class ExperimentCompareHyperParamsGraphComponent implements OnInit, OnDestroy {
  private subs = new Subscription();

  public selectHideIdenticalHyperParams$: Observable<boolean>;
  public hyperParams$: Observable<GroupedHyperParams>;
  public metricsOptions$: Observable<MetricOption[]>;
  public selectedHyperParamsSettings$: Observable<string[]>;
  public experiments$: Observable<ExtraTask[]>;

  public graphs: { [key: string]: ExtFrame };
  public selectedHyperParams: string[] = [];
  public selectedMetric: SelectedMetricVariant;
  public hyperParams: { [section: string]: any };
  public showIdenticalParamsActive: boolean;
  public plotlyReady$ = this.store.select(selectPlotlyReady);
  public metricVariantToPathPipe = new MetricVariantToPathPipe;
  public metrics: MetricOption[];
  public listOpen = true;
  private initView = true;
  private taskIds: string[];

  public scatter: boolean;
  public metricsResults$: Observable<MetricVariantResult[]>;

  public selectedMetricSettings$: Observable<SelectedMetricVariant>;
  public selectedParamsHoverInfo$: Observable<string[]>;
  public selectedMetricsHoverInfo$: Observable<SelectedMetricVariant[]>;
  private: string[] = [];
  private selectedParamsHoverInfo: string[];
  private selectedMetricsHoverInfo: SelectedMetricVariant[];
  private compareIdsFromRoute$: Observable<string>;
  private selectedHyperParamsHoverInfoSettings$: Observable<Array<string>>;
  private selectedMetricsHoverInfoSettings$: Observable<SelectedMetricVariant[]>;
  private selectedMetricsSettings$: Observable<SelectedMetricVariant[]>;
  private routeWasLoaded: boolean;
  private settingsLoaded: boolean;

  public selectedItemsListMapper(data) {
    return decodeURIComponent(data);
  }

  @ViewChild('searchMetric') searchMetricRef: ElementRef;
  selectedMetrics: SelectedMetricVariant[] = [];

  @HostListener('document:click', [])
  clickOut() {
    if (!this.initView) {
      this.listOpen = false;
    }
  }

  @HostListener('window:beforeunload', ['$event']) unloadHandler() {
    this.saveSettingsState();
  }

  constructor(private store: Store,
              private route: ActivatedRoute,
              private router: Router,
              private refresh: RefreshService,
              private reportEmbed: ReportCodeEmbedService,
              private cdr: ChangeDetectorRef) {
    this.metricsOptions$ = this.store.select(selectScalarsGraphMetrics);
    this.metricsResults$ = this.store.select(selectScalarsGraphMetricsResults);
    this.hyperParams$ = this.store.select(selectScalarsGraphHyperParams);
    this.selectedHyperParamsSettings$ = this.store.select(selectSelectedSettingsHyperParams);
    this.selectedHyperParamsHoverInfoSettings$ = this.store.select(selectSelectedSettingsHyperParamsHoverInfo);
    this.selectedParamsHoverInfo$ = this.store.select(selectScalarsParamsHoverInfo);
    this.selectedMetricsHoverInfo$ = this.store.select(selectScalarsMetricsHoverInfo);
    this.selectedMetricSettings$ = this.store.select(selectSelectedSettingsMetric);
    this.selectedMetricsSettings$ = this.store.select(selectSelectedSettingsMetrics);
    this.selectedMetricsHoverInfoSettings$ = this.store.select(selectSelectedSettingsMetricsHoverInfo);
    this.selectHideIdenticalHyperParams$ = this.store.select(selectHideIdenticalFields);
    this.experiments$ = this.store.select(selectScalarsGraphTasks);
    this.compareIdsFromRoute$ = this.store.select(selectCompareIdsFromRoute);
  }

  ngOnInit() {
    this.scatter = this.route.snapshot.data?.scatter;
    this.subs.add(combineLatest([this.hyperParams$, this.selectHideIdenticalHyperParams$])
      .pipe(
        filter(([allParams]) => !!allParams)
      )
      .subscribe(([allParams, hideIdentical]) => {
        this.showIdenticalParamsActive = !hideIdentical;
        this.hyperParams = Object.entries(allParams)
          .reduce((acc, [sectionKey, params]) => {
            const section = Object.keys(params)
              .sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1)
              .reduce((acc2, paramKey) => {
                if (!hideIdentical || params[paramKey]) {
                  acc2[paramKey] = true;
                }
                return acc2;
              }, {});
            if (Object.keys(section).length > 0) {
              acc[sectionKey] = section;
            }
            return acc;
          }, {});
        const selectedHyperParams = this.selectedHyperParams?.filter(selectedParam => has(this.hyperParams, selectedParam.split('.').slice(0, 1).join('.')));
        selectedHyperParams && this.updateServer(this.selectedMetric, selectedHyperParams);
        this.cdr.detectChanges();
      }));

    this.subs.add(combineLatest([this.metricsOptions$, this.hyperParams$, this.store.select(selectRouterQueryParams)]).pipe(
      debounceTime(0)
    ).subscribe(([metrics, hyperparams, queryParams]) => {
      if ((metrics?.length > 0 || Object.keys(hyperparams || {})?.length > 0) && this.settingsLoaded) {
        this.routeWasLoaded = true;
        const flatVariants = flatten(metrics.map(m => m.variants)).map(mv => mv.value);
        if (queryParams.metricPath) {
          if (this.scatter) {
            this.selectedMetric = {
              metric: queryParams.metricName.split('/')[0],
              variant: queryParams.metricName.split('/')[1],
              metric_hash: queryParams.metricPath.split('.')[0],
              variant_hash: queryParams.metricPath.split('.')[1],
              valueType: queryParams.valueType ?? 'value'
            };
          } else {
            //   backwards compatibility 3.21-> 3.20
            this.selectedMetrics = [{
              metric: queryParams.metricName.split('/')[0],
              variant: queryParams.metricName.split('/')[1],
              metric_hash: queryParams.metricPath.split('.')[0],
              variant_hash: queryParams.metricPath.split('.')[1],
              valueType: queryParams.valueType ?? 'value'
            }];
          }
        } else {
          this.selectedMetric = undefined;
        }
        if (queryParams.metricVariants !== undefined && flatVariants?.length > 0) {
          this.selectedMetrics = !queryParams.metricVariants ? [] : queryParams.metricVariants?.split(',').map(path => {
            const variant = flatVariants.find(m => path.startsWith(m.path));
            return {
              metric: variant.name.split('/')[0],
              variant: variant.name.split('/')[1],
              metric_hash: variant.path.split('.')[0],
              variant_hash: variant.path.split('.')[1],
              valueType: path.split('.')[2] ?? 'value'
            };
          });
        } else {
          this.selectedMetrics = [];
        }

        if (queryParams.params) {
          this.selectedHyperParams = Array.isArray(queryParams.params) ? queryParams.params.map(this.selectedItemsListMapper) : [queryParams.params].map(this.selectedItemsListMapper);
        }
      } else {
        this.selectedMetric = null;
        this.selectedMetrics = [];
      }
      this.cdr.detectChanges();
    }));


    this.subs.add(this.compareIdsFromRoute$.pipe(
      filter((ids) => !!ids),
      distinctUntilChanged()
    )
      .subscribe((ids) => {
        this.taskIds = ids.split(',');
        this.store.dispatch(setSelectedExperiments({selectedExperiments: [this.scatter ? 'scatter-param-graph' : 'hyper-param-graph'].concat(this.taskIds)}));
        this.store.dispatch(getExperimentsHyperParams({experimentsIds: this.taskIds, scatter: this.scatter}));
      }));


    this.subs.add(this.refresh.tick
      .pipe(filter(auto => auto !== null))
      .subscribe(autoRefresh =>
        this.store.dispatch(getExperimentsHyperParams({experimentsIds: this.taskIds, autoRefresh}))
      ));

    this.subs.add(combineLatest([this.selectedMetricSettings$, this.selectedHyperParamsSettings$,
      this.selectedMetricsHoverInfoSettings$, this.selectedHyperParamsHoverInfoSettings$, this.selectedMetricsSettings$]).pipe(
      take(1)
    )
      .subscribe(([selectedMetric, selectedParams, selectedMetricsHoverInfo, selectedParamsHoverInfo, selectedMetrics]) => {
        selectedMetricsHoverInfo?.length > 0 && this.store.dispatch(setMetricsHoverInfo({metricsHoverInfo: selectedMetricsHoverInfo as SelectedMetricVariant[]}));
        selectedParamsHoverInfo?.length > 0 && this.store.dispatch(setParamsHoverInfo({paramsHoverInfo: selectedParamsHoverInfo}));
        this.updateServer(selectedMetric, selectedParams, false, null, selectedMetrics, true);
        this.settingsLoaded = true;
      }));
    this.subs.add(this.selectedParamsHoverInfo$
      .subscribe(p => this.selectedParamsHoverInfo = p));
    this.subs.add(this.selectedMetricsHoverInfo$
      .subscribe(p => this.selectedMetricsHoverInfo = p));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.saveSettingsState();
    this.clearParamsForHoverSelection();
    this.store.dispatch(setMetricsHoverInfo({metricsHoverInfo: []}));
  }


  metricVariantSelected($event?: SelectionEvent) {
    this.updateServer({...$event.variant, valueType: $event.valueType}, this.selectedHyperParams);
  }

  selectedParamsChanged({param}) {
    param = decodeURI(param);
    if (this.scatter) {
      this.updateServer(this.selectedMetric, this.selectedHyperParams.includes(param) ? [] : [param]);
    } else {
      const newSelectedParamsList = this.selectedHyperParams.includes(param) ? this.selectedHyperParams.filter(i => i !== param) : [...this.selectedHyperParams, param];
      this.updateServer(this.selectedMetric, newSelectedParamsList);
    }
  }

  clearSelection() {
    this.updateServer(this.selectedMetric, []);
  }

  showIdenticalParamsToggled() {
    this.store.dispatch(setShowIdenticalHyperParams());
  }


  updateServer(selectedMetric?: SelectedMetricVariant,
               selectedParams?: string[],
               skipNavigation?: boolean,
               valueType?: SelectedMetricVariant['valueType'],
               selectedMetrics?: SelectedMetricVariant[],
               force?: boolean) {
    if ((this.routeWasLoaded || force) && !skipNavigation) {
      this.router.navigate([], {
        queryParams: {
          metricPath: selectedMetric ? `${selectedMetric?.metric_hash}.${selectedMetric?.variant_hash}` : undefined,
          ...(isArray(selectedMetrics) && {metricVariants: selectedMetrics.map(mv => this.metricVariantToPathPipe.transform(mv, true)).toString()}),
          metricName: selectedMetric ? `${selectedMetric?.metric}/${selectedMetric?.variant}` : undefined,
          ...(selectedParams && {params: selectedParams}),
          valueType: selectedMetric ? selectedMetric?.valueType || valueType || 'value' : undefined
        },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }


  createEmbedCode(event: {
    tasks: string[];
    valueType: MetricValueType;
    metrics?: string[];
    variants?: string[];
    domRect: DOMRect
  }) {
    this.reportEmbed.createCode({
      type: 'parcoords',
      objects: event.tasks,
      objectType: 'task',
      ...event
    });
  }

  saveSettingsState() {
    this.store.dispatch(setExperimentSettings({
      id: [this.scatter ? 'scatter-param-graph' : 'hyper-param-graph'].concat(this.taskIds),
      changes: {
        selectedMetric: this.selectedMetric,
        selectedMetrics: this.selectedMetrics,
        selectedHyperParams: this.selectedHyperParams,
        selectedParamsHoverInfo: this.selectedParamsHoverInfo,
        selectedMetricsHoverInfo: this.selectedMetricsHoverInfo
      }
    }));
  }


  clearParamsSelection() {
    this.updateServer(this.selectedMetric, []);
  }

  clearMetricsSelection() {
    this.updateServer(null, undefined, false, undefined, []);
  }

  selectedParamsForHoverChanged({param}) {
    param = decodeURI(param);
    const newSelectedParamsList = this.selectedParamsHoverInfo.includes(param) ? this.selectedParamsHoverInfo.filter(i => i !== param) : [...this.selectedParamsHoverInfo, param].map(this.selectedItemsListMapper);
    this.store.dispatch(setParamsHoverInfo({paramsHoverInfo: newSelectedParamsList}));

  }

  clearParamsForHoverSelection() {
    this.store.dispatch(setParamsHoverInfo({paramsHoverInfo: []}));
  }

  metricVariantForHoverSelected($event: SelectionEvent) {
    const newSelectedVariantList = $event.addCol ? [...this.selectedMetricsHoverInfo, $event.variant] : [...this.selectedMetricsHoverInfo.filter(metricVar => !isEqual(metricVar, $event.variant))];
    this.store.dispatch(setMetricsHoverInfo({metricsHoverInfo: newSelectedVariantList as SelectedMetricVariant[]}));
  }

  multiMetricVariantSelected($event: SelectionEvent) {
    if ($event.valueType) {
      const selectedVariant = {...$event.variant, valueType: $event.valueType};
      const newSelectedVariantList = $event.addCol ? [...this.selectedMetrics, selectedVariant] :
        [...this.selectedMetrics.filter(metricVar => !isEqual(metricVar, selectedVariant))];
      this.updateServer(null, this.selectedHyperParams, false, undefined, newSelectedVariantList);
    }
  }


  clearMetricsSelectionForHover() {
    this.store.dispatch(setMetricsHoverInfo({metricsHoverInfo: [] as SelectedMetricVariant[]}));
  }
}
