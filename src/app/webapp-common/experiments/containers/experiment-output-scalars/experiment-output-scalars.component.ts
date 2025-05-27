import {ChangeDetectorRef, Component, EffectRef, inject, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';
import {RefreshService} from '@common/core/services/refresh.service';
import {
  selectExperimentInfoHistograms,
  selectExperimentMetricsSearchTerm,
  selectHasScalarSingleValue,
  selectIsExperimentInProgress,
  selectLastMetricsValues,
  selectMetricValuesView,
  selectScalarSingleValue, selectSelectedExperimentFromRouter, selectSelectedExperimentSettings,
  selectSelectedSettingsGroupBy,
  selectSelectedSettingsHiddenScalar, selectSelectedSettingsIsProjectLevel, selectSelectedSettingsSmoothSigma,
  selectSelectedSettingsSmoothType,
  selectSelectedSettingsSmoothWeight, selectSelectedSettingsTableMetric,
  selectSelectedSettingsxAxisType,
  selectShowSettings,
  selectSplitSize
} from '../../reducers';
import {Observable, Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {debounceTime, distinctUntilChanged, filter} from 'rxjs/operators';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {ActivatedRoute, Params} from '@angular/router';
import {
  experimentScalarRequested,
  GroupByCharts,
  groupByCharts,
  removeExperimentSettings,
  resetExperimentMetrics,
  setExperimentMetricsSearchTerm,
  setExperimentSettings,
  toggleSettings
} from '../../actions/common-experiment-output.actions';
import {convertScalars, convertSplitScalars, sortMetricsList} from '@common/tasks/tasks.utils';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import {ExtFrame} from '@common/shared/single-graph/plotly-graph-base';
import {ExperimentGraphsComponent} from '@common/shared/experiment-graphs/experiment-graphs.component';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {smoothTypeEnum, SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {singleValueChartTitle} from '@common/experiments/shared/common-experiments.const';
import {GroupedList} from '@common/tasks/tasks.model';
import {toSignal} from '@angular/core/rxjs-interop';
import {explicitEffect} from 'ngxtension/explicit-effect';
import {computedPrevious} from 'ngxtension/computed-previous';

@Component({
  selector: 'sm-experiment-output-scalars',
  templateUrl: './experiment-output-scalars.component.html',
  styleUrls: ['./experiment-output-scalars.component.scss', './shared-experiment-output.scss'],
  standalone: false
})
export class ExperimentOutputScalarsComponent implements OnInit, OnDestroy {
  protected store = inject(Store);
  protected activeRoute = inject(ActivatedRoute);
  private changeDetection = inject(ChangeDetectorRef);
  private reportEmbed = inject(ReportCodeEmbedService);
  private refreshService = inject(RefreshService);

  public scalarList = signal<GroupedList>({});

  private subs = new Subscription();
  protected routerParams$: Observable<Params>;
  public refreshDisabled: boolean;
  public minimized = false;
  public graphs = signal<Record<string, ExtFrame[]>>(null);
  public selectIsExperimentPendingRunning: Observable<boolean>;
  public showSettingsBar = this.store.selectSignal(selectShowSettings);
  protected searchTerm = this.store.selectSignal(selectExperimentMetricsSearchTerm);
  protected metricValuesView = this.store.selectSignal(selectMetricValuesView);
  protected lastMetricsValues = this.store.selectSignal(selectLastMetricsValues);
  protected tableSelectedMetrics = this.store.selectSignal(selectSelectedSettingsTableMetric);
  protected splitSize = this.store.selectSignal(selectSplitSize);
  protected entitySelector = this.store.select(selectSelectedExperimentFromRouter);
  protected scalars = this.store.selectSignal(selectExperimentInfoHistograms);
  protected smoothWeight = toSignal(this.store.select(selectSelectedSettingsSmoothWeight).pipe(filter(smooth => smooth !== null)));
  protected smoothSigma = toSignal(this.store.select(selectSelectedSettingsSmoothSigma).pipe(filter(sigma => sigma !== null)));
  protected smoothWeightDelayed = toSignal(this.store.select(selectSelectedSettingsSmoothWeight).pipe(debounceTime(75)));
  protected smoothSigmaDelayed = toSignal(this.store.select(selectSelectedSettingsSmoothSigma).pipe(debounceTime(75)));
  protected smoothType = this.store.selectSignal(selectSelectedSettingsSmoothType);
  protected xAxisType = this.store.selectSignal(selectSelectedSettingsxAxisType(false));
  protected xAxisTypePrev = computedPrevious(this.xAxisType);
  protected groupBy = this.store.selectSignal(selectSelectedSettingsGroupBy);
  protected singleValueData = this.store.selectSignal(selectScalarSingleValue);
  protected hasSingleValueData = this.store.selectSignal(selectHasScalarSingleValue);
  protected listOfHidden = this.store.selectSignal(selectSelectedSettingsHiddenScalar());
  protected allSettings = this.store.selectSignal(selectSelectedExperimentSettings());
  protected isProjectLevel = this.store.selectSignal(selectSelectedSettingsIsProjectLevel);
  protected experiment = this.store.selectSignal<{ name?: string; id: string }>(selectSelectedExperiment);
  protected experimentId = this.store.selectSignal(selectSelectedExperimentFromRouter);
  protected projectId = this.store.selectSignal<string>(selectRouterProjectId);

  protected entityType: 'task' | 'model' = 'task';
  protected exportForReport = true;

  @ViewChild(ExperimentGraphsComponent) experimentGraphs;
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
  protected selectedMetrics = signal<string[]>(null);
  private originalScalarList: { metric: string; variant: string }[];
  private firstTime = true;
  protected xAxisEffectRef: EffectRef;
  protected mainEffectRef1: EffectRef;
  protected mainEffectRef2: EffectRef;

  constructor() {
    this.routerParams$ = this.store.select(selectRouterParams)
      .pipe(
        filter(params => !!params.experimentId),
        distinctUntilChanged()
      );

    this.selectIsExperimentPendingRunning = this.store.select(selectIsExperimentInProgress);

    this.mainEffectRef1 = explicitEffect(
      [this.listOfHidden], ([hiddenList]) => {
        if (this.scalars() && this.groupBy() && hiddenList) {
          this.dataHandler(this.scalars(), hiddenList, this.groupBy(), true);
        }
      });

    this.mainEffectRef2 = explicitEffect(
      [this.groupBy, this.scalars, this.xAxisType], ([groupBy, scalars]) => {
        if (groupBy && scalars &&
          // prevent rendering chart with misfit x-axis type and data
          ( Object.values(scalars || {}).length === 0 ||
            (this.xAxisType() !== 'iter' && Object.values(Object.values(scalars || {})[0] || {})?.[0]?.x?.[0] > 1600000000000) ||
            (this.xAxisType() === 'iter' && Object.values(Object.values(scalars || {})[0] || {})?.[0]?.x?.[0] < 1600000000000))
        ) {
          this.dataHandler(scalars, this.listOfHidden(), groupBy, false);
        }
      });

    this.xAxisEffectRef = explicitEffect(
      [this.xAxisType],
      ([xAxisType]) => {
        if (this.experiment() && xAxisType && this.xAxisTypePrev() !== xAxisType) {
          this.axisChanged();
        }
      });

  }

  protected dataHandler(scalars, hiddenList, groupBy, skipCalc) {
    this.refreshDisabled = false;
    this.originalScalarList = [
      ...(this.hasSingleValueData() ? [{metric: singleValueChartTitle, variant: null}] : []),
      ...Object.entries(scalars).map(([metric, value]) => Object.keys(value).map((variant) => ({
        metric,
        variant
      }))).flat()
    ];
    if (!skipCalc) {
      this.prepareGraphsAndUpdate(scalars);
    }

    const selectedMetric = (!this.isProjectLevel() && this.firstTime && hiddenList.length === 0) ?
      this.originalScalarList.slice(0, 20) :
      groupBy === 'metric' ?
        this.originalScalarList.filter(({metric}) => !hiddenList.includes(metric)) :
        this.originalScalarList.filter(({metric, variant}) => variant !== null ?
          !hiddenList.includes(`${metric}${variant}`) && !hiddenList.includes(metric) :
          !hiddenList.includes(metric)
        );
    this.firstTime = false;
    const metricsWithoutVariants = selectedMetric
      .map(({metric}) => metric)
      .filter(m => !!m);
    this.selectedMetrics.set(Array.from(new Set([
      ...selectedMetric.map(({metric, variant}) => `${metric}${variant}`),
      ...metricsWithoutVariants
    ])));
  }

  ngOnInit() {
    this.minimized = this.activeRoute.snapshot.routeConfig.data?.minimized;

    this.subs.add(this.refreshService.tick
      .pipe(filter(autoRefresh => autoRefresh !== null && !!this.experiment()?.id))
      .subscribe(() => this.refresh())
    );

    this.subs.add(this.routerParams$
      .subscribe(params => {
        if (!this.experimentId() || ![params.experimentId, params.modelId].includes(this.experimentId())) {
          this.graphs.set(undefined);
          this.resetMetrics();
          // this.store.dispatch(new ExperimentScalarRequested(params.experimentId));
          this.store.dispatch(setExperimentMetricsSearchTerm({searchTerm: ''}));
        }
      })
    );

    this.subs.add(this.entitySelector
      .pipe(
        filter(entity => !!entity),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.scalarList.set({});
        this.selectedMetrics.set(null);
        this.refresh();
      }));
  }

  private prepareGraphsAndUpdate(scalars: GroupedList) {
    if (scalars) {
      const taskId = this.experiment()?.id ?? this.experimentId();
      this.scalarList.set({...(this.hasSingleValueData() && {[singleValueChartTitle]: {}}), ...this.prepareScalarList(scalars, this.groupBy() === 'none')});
      this.graphs.set(this.groupBy() === 'metric' ? convertScalars(scalars, taskId) : convertSplitScalars(scalars, taskId));
      // this.changeDetection.markForCheck();
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.resetMetrics();
  }

  metricSelected(id) {
    this.experimentGraphs?.scrollToGraph(id);
  }


  hiddenListChanged(hiddenList: string[]) {
    const metrics = this.originalScalarList.map(metric => metric.metric);
    const variants = this.originalScalarList.map(metric => `${metric.metric}${metric.variant || ''}`);
    const nonTaskMetrics = this.listOfHidden().filter(m => !metrics.some(metric => metric.startsWith(m)) && !variants.includes(m));
    const newList = [
      ...metrics.filter(metric => !hiddenList.some(a => a.startsWith(metric))),
      ...variants.filter(metric => this.groupBy() === 'none' ? !hiddenList.includes(metric) : !hiddenList.some(a => metric.startsWith(a))),
      ...nonTaskMetrics.filter(metric => !hiddenList.includes(metric))
    ];

    const metricsWithoutVariants = metrics.filter(metric => !variants.filter(v => v.startsWith(metric)).filter(v => !newList.includes(v)).length);
    this.store.dispatch(setExperimentSettings({
      id: this.experiment()?.id,
      changes: {
        ...this.getSettingsObject(),
        hiddenMetricsScalar: Array.from(new Set(newList.concat(metricsWithoutVariants)))
      }
    }));
  }

  refresh() {
    if (!this.refreshDisabled) {
      this.refreshDisabled = true;
      this.store.dispatch(experimentScalarRequested({experimentId: this.experimentId(), refresh: true}));
    }
  }

  prepareScalarList = (metricsScalar: GroupedList, splitted: boolean): GroupedList =>
    sortMetricsList(Object.keys(metricsScalar || [])).reduce((acc, curr) => {
      const variants = Object.keys(metricsScalar[curr]);
      if (splitted) {
        if (variants.length > 1) {
          acc[curr] = {};
          Object.keys(metricsScalar[curr]).forEach((variant) => {
            acc[curr][variant] = {};
          });
        } else {
          acc[curr + variants[0]] = {__displayName: `${curr} - ${variants[0]}`};
        }
      } else {
        acc[curr] = {};
      }
      return acc;
    }, {});

  searchTermChanged(searchTerm: string) {
    this.store.dispatch(setExperimentMetricsSearchTerm({searchTerm}));
  }

  resetMetrics() {
    this.store.dispatch(resetExperimentMetrics());
  }

  changeSmoothness($event: number) {
    this.store.dispatch(setExperimentSettings({id: this.experiment()?.id, changes: {...this.getSettingsObject(), smoothWeight: $event}}));
  }

  changeSigma($event: number) {
    this.store.dispatch(setExperimentSettings({id: this.experiment()?.id, changes: {...this.getSettingsObject(), smoothSigma: $event}}));
  }

  changeSmoothType($event: SmoothTypeEnum) {
    this.store.dispatch(setExperimentSettings({id: this.experiment()?.id, changes: {...this.getSettingsObject(), smoothType: $event}}));
  }

  changeXAxisType($event: ScalarKeyEnum) {
    this.store.dispatch(setExperimentSettings({id: this.experiment()?.id, changes: {...this.getSettingsObject(), xAxisType: $event}}));
  }

  changeGroupBy($event: GroupByCharts) {
    this.store.dispatch(setExperimentSettings({id: this.experiment()?.id, changes: {...this.getSettingsObject(), groupBy: $event}}));
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
    this.store.dispatch(setExperimentSettings({changes: {...this.allSettings(), id: this.projectId(), projectLevel: true}, id: this.projectId()}));
    this.store.dispatch(removeExperimentSettings({id: this.experiment()?.id}));
  }

  toggleSettingsBar() {
    this.store.dispatch(toggleSettings());
  }

  createEmbedCode(event: { metrics?: string[]; variants?: string[]; xaxis?: ScalarKeyEnum; domRect: DOMRect; group?: boolean }) {
    this.reportEmbed.createCode({
      type: (!event.metrics && !event.variants) ? 'single' : 'scalar',
      objects: [this.experiment()?.id],
      objectType: this.entityType,
      ...event
    });
  }

  protected axisChanged() {
    this.store.dispatch(experimentScalarRequested({experimentId: this.experiment()?.id, skipSingleValue: true}));
  }

  selectedMetricsChanged(selectedMetrics: string[]) {
    this.store.dispatch(setExperimentSettings({
      id: this.experiment()?.id,
      changes: {selectedMetricTable: selectedMetrics}
    }));
  }
}
