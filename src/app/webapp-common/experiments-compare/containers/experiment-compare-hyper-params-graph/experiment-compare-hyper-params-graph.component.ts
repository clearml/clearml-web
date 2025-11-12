import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy
} from '@angular/core';
import {debounceTime, distinctUntilChanged, filter, combineLatest, Subscription, take} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {castArray, flatten, isEqual} from 'lodash-es';
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
import {MetricOption} from '../../reducers/experiments-compare-charts.reducer';
import {selectPlotlyReady} from '@common/core/reducers/view.reducer';
import {ExtFrame} from '@common/shared/single-graph/plotly-graph-base';
import {RefreshService} from '@common/core/services/refresh.service';
import {MetricValueType, SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {ActivatedRoute, Router} from '@angular/router';
import {
  SelectionEvent
} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {MetricVariantToPathPipe} from '@common/shared/pipes/metric-variant-to-path.pipe';
import {encodeMetric} from '@common/shared/utils/tableParamEncode';
import {mapArray} from 'ngxtension/map-array';


@Component({
  selector: 'sm-experiment-compare-hyper-params-graph',
  templateUrl: './experiment-compare-hyper-params-graph.component.html',
  styleUrls: ['./experiment-compare-hyper-params-graph.component.scss'],
  host: {
    '(document:click)': 'clickOut()',
    '(window:beforeunload)': 'unloadHandler()'
  },
  standalone: false
})
export class ExperimentCompareHyperParamsGraphComponent implements OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private refresh = inject(RefreshService);
  private reportEmbed = inject(ReportCodeEmbedService);
  private cdr = inject(ChangeDetectorRef);

  protected readonly decodeURIComponent = decodeURIComponent;
  private subs = new Subscription();
  private initView = true;
  private taskIds: string[];
  private selectedParamsHoverInfo: {section: string; name: string}[];
  private selectedMetricsHoverInfo: SelectedMetricVariant[];
  private routeWasLoaded: boolean;
  private settingsLoaded: boolean;
  protected graphs: Record<string, ExtFrame>;
  protected selectedHyperParams: {section: string; name: string}[] = [];
  protected encodedHyperParams: string[];
  protected selectedMetric: SelectedMetricVariant;
  protected hyperParams: Record<string, Record<string, string>>;
  protected showIdenticalParamsActive: boolean;
  protected plotlyReady$ = this.store.select(selectPlotlyReady);
  protected metricVariantToPathPipe = new MetricVariantToPathPipe;
  protected metrics: MetricOption[];
  protected listOpen = true;
  protected scatter: boolean;

  protected metricsOptions$ = this.store.select(selectScalarsGraphMetrics);
  protected metricsResults$ = this.store.select(selectScalarsGraphMetricsResults);
  protected hyperParams$ = this.store.select(selectScalarsGraphHyperParams);
  protected selectedHyperParamsSettings$ = this.store.select(selectSelectedSettingsHyperParams);
  protected selectedHyperParamsHoverInfoSettings$ = this.store.select(selectSelectedSettingsHyperParamsHoverInfo);
  protected selectedParamsHoverInfo$ = this.store.select(selectScalarsParamsHoverInfo);
  protected selectedParamsHoverInfoEncoded$ = this.selectedParamsHoverInfo$
    .pipe(mapArray(param => this.paramEncoder(param)));
  protected selectedMetricsHoverInfo$ = this.store.select(selectScalarsMetricsHoverInfo);
  protected selectedMetricSettings$ = this.store.select(selectSelectedSettingsMetric);
  protected selectedMetricsSettings$ = this.store.select(selectSelectedSettingsMetrics);
  protected selectedMetricsHoverInfoSettings$ = this.store.select(selectSelectedSettingsMetricsHoverInfo);
  protected selectHideIdenticalHyperParams$ = this.store.select(selectHideIdenticalFields);
  protected experiments$ = this.store.select(selectScalarsGraphTasks);
  protected compareIdsFromRoute$ = this.store.select(selectCompareIdsFromRoute);
  protected selectedMetrics: SelectedMetricVariant[] = [];


  protected paramEncoder({section, name}: {section: string; name: string}) {
    return `${encodeMetric(section)}.${encodeMetric(name)}`
  }

  protected paramEncoderOnlyDotsForBE({section, name}: {section: string; name: string}) {
    return `${section.replaceAll('.', '%2E')}.${name.replaceAll('.', '%2E')}`
  }

  protected paramDecoder(data: string) {
    const [section, name] = data.split('.');
    return {section: decodeURIComponent(section), name: decodeURIComponent(name)};
  }

  constructor() {
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
        const selectedHyperParams = this.selectedHyperParams?.filter(selectedParam =>
          this.hyperParams[selectedParam.section]?.[selectedParam.name]) ?? [];
        this.updateServer(this.selectedMetric, selectedHyperParams);
        this.cdr.markForCheck();
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
          this.encodedHyperParams = queryParams.params;
          this.selectedHyperParams = castArray(queryParams.params).map(this.paramDecoder);
        }
      } else {
        this.selectedMetric = null;
        this.selectedMetrics = [];
      }
      this.cdr.markForCheck();
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

    this.subs.add(combineLatest([
      this.selectedMetricSettings$,
      this.selectedHyperParamsSettings$,
      this.selectedMetricsHoverInfoSettings$,
      this.selectedHyperParamsHoverInfoSettings$,
      this.selectedMetricsSettings$
    ])
      .pipe(take(1))
      .subscribe(([selectedMetric, selectedParams, selectedMetricsHoverInfo, selectedParamsHoverInfo, selectedMetrics]) => {
        if (selectedMetricsHoverInfo?.length > 0) {
          this.store.dispatch(setMetricsHoverInfo({metricsHoverInfo: selectedMetricsHoverInfo as SelectedMetricVariant[]}));
          this.store.dispatch(setParamsHoverInfo({paramsHoverInfo: selectedParamsHoverInfo.map(this.paramDecoder)}));
        }
        this.updateServer(selectedMetric, selectedParams?.map(this.paramDecoder) ?? [], false, null, selectedMetrics, true);
        this.settingsLoaded = true;
      }));

    this.subs.add(this.selectedParamsHoverInfo$
      .subscribe(p => this.selectedParamsHoverInfo = p));
    this.subs.add(this.selectedMetricsHoverInfo$
      .subscribe(p => this.selectedMetricsHoverInfo = p));
  }

  clickOut() {
    if (!this.initView) {
      this.listOpen = false;
    }
  }

  unloadHandler() {
    this.saveSettingsState();
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
    const selected = this.paramDecoder(param);
    const included = this.selectedHyperParams.some(p => p.name === selected.name && p.section === selected.section);
    if (this.scatter) {
      this.updateServer(this.selectedMetric, included ? [] : [selected]);
    } else {
      const newSelectedParamsList = included ?
        this.selectedHyperParams.filter(p => !(p.name === selected.name && p.section === selected.section)) :
        [...this.selectedHyperParams, selected];
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
               selectedParams?: {section: string; name: string}[],
               skipNavigation?: boolean,
               valueType?: SelectedMetricVariant['valueType'],
               selectedMetrics?: SelectedMetricVariant[],
               force?: boolean) {
    if ((this.routeWasLoaded || force) && !skipNavigation) {
      this.router.navigate([], {
        queryParams: {
          metricPath: selectedMetric ? `${selectedMetric?.metric_hash}.${selectedMetric?.variant_hash}` : undefined,
          ...(Array.isArray(selectedMetrics) && {metricVariants: selectedMetrics.map(mv => this.metricVariantToPathPipe.transform(mv, true)).toString()}),
          metricName: selectedMetric ? `${selectedMetric?.metric}/${selectedMetric?.variant}` : undefined,
          ...(selectedParams && {params: selectedParams.map(param => this.paramEncoder(param))}),
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
    variants?: {section: string; name: string}[];
    domRect: DOMRect
  }) {
    this.reportEmbed.createCode({
      type: 'parcoords',
      objects: event.tasks,
      objectType: 'task',
      ...event,
      variants: event.variants.map(this.paramEncoderOnlyDotsForBE)
    });
  }

  saveSettingsState() {
    this.store.dispatch(setExperimentSettings({
      id: [this.scatter ? 'scatter-param-graph' : 'hyper-param-graph'].concat(this.taskIds),
      changes: {
        selectedMetric: this.selectedMetric,
        selectedMetrics: this.selectedMetrics,
        selectedHyperParams: this.selectedHyperParams.map(this.paramEncoder),
        selectedParamsHoverInfo: this.selectedParamsHoverInfo.map(this.paramEncoder),
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
    const selected = this.paramDecoder(param);
    const included = this.selectedParamsHoverInfo.some(p => p.name === selected.name && p.section === selected.section);
    const newSelectedParamsList = included ?
      this.selectedParamsHoverInfo.filter(p => !(p.name === selected.name && p.section === selected.section)) :
      [...this.selectedParamsHoverInfo, selected];
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
