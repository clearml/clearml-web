import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  viewChild
} from '@angular/core';
import {selectRouterConfig, selectRouterParams} from '@common/core/reducers/router-reducer';
import {sanitizeCSVCell} from '@common/shared/utils/download';
import {Store} from '@ngrx/store';
import {combineLatestWith, distinctUntilChanged, distinctUntilKeyChanged, filter, map, take, tap, throttleTime} from 'rxjs/operators';
import {isEqual, mergeWith} from 'lodash-es';
import {fromEvent, Observable, startWith, Subscription} from 'rxjs';
import * as metricsValuesActions from '../../actions/experiments-compare-metrics-values.actions';
import {selectCompareMetricsValuesExperiments, selectExportTable, selectSelectedExperimentSettings, selectShowRowExtremes} from '../../reducers';
import {ActivatedRoute} from '@angular/router';
import {RefreshService} from '@common/core/services/refresh.service';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {Task} from '~/business-logic/model/tasks/task';
import {FormControl} from '@angular/forms';
import {setExperimentSettings, setSelectedExperiments} from '@common/experiments-compare/actions/experiments-compare-charts.actions';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {rgbList2Hex} from '@common/shared/services/color-hash/color-hash.utils';
import {mkConfig, download, generateCsv} from 'export-to-csv';
import {setExportTable} from '@common/experiments-compare/actions/compare-header.actions';
import {Table} from 'primeng/table';
import {ExperimentCompareSettings} from '@common/experiments-compare/reducers/experiments-compare-charts.reducer';
import {GroupedList} from '@common/tasks/tasks.model';
import {sortMetricsList} from '@common/tasks/tasks.utils';
import {PlotData} from 'plotly.js';

interface ValueMode {
  key: string;
  name: string;
}

interface ValueModes {

  min_values: ValueMode,

  max_values: ValueMode,
  values: ValueMode,
}

const VALUE_MODES: ValueModes = {

  min_values: {
    key: 'min_value',
    name: 'Min Value'
  },

  max_values: {
    key: 'max_value',
    name: 'Max Value'
  },
  values: {
    key: 'value',
    name: 'Last Value'
  }
};


interface tableRow {
  metricId: string;
  variantId: string;
  metric: string;
  variant: string;
  firstMetricRow: boolean;
  lastInGroup: boolean;
  values: Record<string, Task['last_metrics']>;
}

interface ExtTask extends Task {
  orgName?: string;
}

@Component({
    selector: 'sm-experiment-compare-metric-values',
    templateUrl: './experiment-compare-metric-values.component.html',
    styleUrls: ['./experiment-compare-metric-values.component.scss', '../../cdk-drag.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExperimentCompareMetricValuesComponent implements OnInit, OnDestroy {
  public experiments: ExtTask[] = [];
  public taskIds: string[];
  public valuesMode: ValueMode;
  private entityType: EntityTypeEnum;
  private comparedTasks$: Observable<Task[]>;
  public dataTable: tableRow[];
  public dataTableFiltered: tableRow[];
  public variantFilter = new FormControl('');
  public selectShowRowExtremes$: Observable<boolean>;
  public listSearchTerm: string;
  public metricVariantList: GroupedList;
  public filterOpen: boolean;
  public experimentsColor: Record<string, string>;

  private subs = new Subscription();
  private selectExportTable$: Observable<boolean>;
  public showFilterTooltip = false;

  table = viewChild(Table);
  private scrollContainer: HTMLDivElement;
  public scrolled: boolean;
  public filterValue: string;
  public settings: ExperimentCompareSettings = null;
  private initialSettings = {
    selectedMetricsScalar: []
  } as ExperimentCompareSettings;
  private originalSelection: string[];
  private selectedExperimentsSettings$: Observable<ExperimentCompareSettings>;

  @HostListener('window:beforeunload', ['$event']) unloadHandler() {
    this.saveSettingsState();
  }

  constructor(
    private route: ActivatedRoute,
    public store: Store,
    private changeDetection: ChangeDetectorRef,
    private refresh: RefreshService,
    private colorHash: ColorHashService
  ) {
    this.comparedTasks$ = this.store.select(selectCompareMetricsValuesExperiments);
    this.selectShowRowExtremes$ = this.store.select(selectShowRowExtremes);
    this.selectExportTable$ = this.store.select(selectExportTable).pipe(filter(e => !!e));
    this.selectedExperimentsSettings$ = this.store.select(selectSelectedExperimentSettings).pipe(distinctUntilChanged(isEqual));
  }

  ngOnInit() {
    this.entityType = this.route.snapshot.parent.parent.data.entityType;

    this.subs.add(this.store.select(selectRouterConfig)
      .pipe(
        map(params => params?.at(-1).replace('-', '_')),
        distinctUntilChanged()
      )
      .subscribe((valuesMode) => {
        this.valuesMode = VALUE_MODES[valuesMode] || VALUE_MODES['values'];
        this.changeDetection.markForCheck();
      }));

    this.subs.add(this.store.select(selectRouterParams)
      .pipe(
        distinctUntilKeyChanged('ids'),
        map(params => params?.ids?.split(',')),
        tap(taskIds => this.taskIds = taskIds),
        filter(taskIds => !!taskIds && taskIds?.join(',') !== this.getExperimentIdsParams(this.experiments))
      )
      .subscribe((experimentIds: string[]) => {
        this.store.dispatch(setSelectedExperiments({selectedExperiments: this.taskIds}));
        this.store.dispatch(metricsValuesActions.getComparedExperimentsMetricsValues({
          taskIds: experimentIds,
          entity: this.entityType
        }));
      }));

    this.subs.add(this.comparedTasks$
      .pipe(
        filter(exp => !!exp),
        distinctUntilChanged(),
        tap(experiments => {
          const nameRepetitions = experiments.reduce((acc, exp) => {
            acc[exp.name] = (acc[exp.name] ?? 0) + 1;
            return acc;
          }, {});
          this.experiments = experiments.map(exp => nameRepetitions[exp.name] > 1 ? {...exp, orgName: exp.name, name: `${exp.name}.${exp.id.substring(0, 6)}`} : exp);
          this.experimentsColor = experiments.reduce((acc, exp) => {
            acc[exp.id] = rgbList2Hex(this.colorHash.initColor(`${exp.name}-${exp.id}`));
            return acc;
          }, {} as Record<string, string>);
        })
      )
      .subscribe(experiments => {
        this.buildTableData(experiments);
        this.changeDetection.detectChanges();
        this.startTableScrollListener();
      }));

    this.subs.add(this.refresh.tick
      .pipe(filter(auto => auto !== null))
      .subscribe((autoRefresh) => this.store.dispatch(
        metricsValuesActions.getComparedExperimentsMetricsValues({taskIds: this.taskIds, entity: this.entityType, autoRefresh})
      )));

    this.subs.add(this.selectedExperimentsSettings$
      .pipe(combineLatestWith(this.variantFilter.valueChanges.pipe(startWith(''))))
      .subscribe(([, variantFilter]) => {
        this.filterValue = variantFilter;
        this.filter(this.filterValue);
      })
    );

    this.subs.add(this.colorHash.getColorsObservable()
      .subscribe(() => {
        this.experimentsColor = this.experiments?.reduce((acc, exp) => {
          acc[exp.id] = rgbList2Hex(this.colorHash.initColor(`${exp.orgName ?? exp.name}-${exp.id}`));
          return acc;
        }, {} as Record<string, string>);
        this.changeDetection.detectChanges();
      }));

    this.subs.add(this.selectExportTable$
      .subscribe(() => {
        if (this.dataTableFiltered.length) {
          this.exportToCSV();
        }
        this.store.dispatch(setExportTable({export: false}));
      }));

    this.selectedExperimentsSettings$
      .pipe(take(1))
      .subscribe(settings => {
        this.originalSelection = settings.selectedMetricsScalar;
      });
  }

  private startTableScrollListener() {
    this.scrollContainer = this.table()?.el.nativeElement.getElementsByClassName('p-scroller')[0] ?? this.table()?.el.nativeElement.getElementsByClassName('p-datatable-table-container')[0] as HTMLDivElement;
    if (this.scrollContainer) {
      fromEvent(this.scrollContainer, 'scroll').pipe(throttleTime(150, undefined, {leading: true, trailing: true})).subscribe((e: Event) => {
        this.scrolled = (e.target as HTMLDivElement).scrollLeft > 10;
        this.changeDetection.detectChanges();
      });
    }
  }

  ngOnDestroy(): void {
    this.saveSettingsState();
    this.store.dispatch(metricsValuesActions.resetState());
    this.subs.unsubscribe();
  }

  buildTableData(experiments: Task[]) {
    if (experiments?.length > 0) {
      const lastMetrics = experiments.map(exp => exp.last_metrics);
      let allMetricsVariants: Task['last_metrics'] = {};
      allMetricsVariants = mergeWith(allMetricsVariants, ...lastMetrics);

      this.metricVariantList = {};
      this.dataTable = sortMetricsList(Object.keys(allMetricsVariants)).map((metricId) => Object.keys(allMetricsVariants[metricId]).map(variantId => {
        let metric, variant;
        return {
          metricId,
          variantId,
          ...experiments.reduce((acc, exp) => {
            acc.values[exp.id] = exp.last_metrics[metricId]?.[variantId] as Task['last_metrics'];
            if (!metric && !variant && exp.last_metrics[metricId]?.[variantId]) {
              metric = (metric ?? exp.last_metrics[metricId][variantId].metric).replace('Summary', ' Summary');
              variant = variant ?? exp.last_metrics[metricId][variantId].variant;
            }
            if (metric) {
              if (this.metricVariantList[metric]) {
                this.metricVariantList[metric][variant] = {} as PlotData;
              } else {
                this.metricVariantList[metric] = {[variant]: {} as PlotData};
              }
            }
            return {
              metric,
              variant,
              values: acc.values,
              firstMetricRow: false,
              lastInGroup: false,
              min: acc.min ? Math.min(acc.min, exp.last_metrics[metricId]?.[variantId]?.[this.valuesMode.key] ?? acc.min) : exp.last_metrics[metricId]?.[variantId]?.[this.valuesMode.key],
              max: acc.max ? Math.max(acc.max, exp.last_metrics[metricId]?.[variantId]?.[this.valuesMode.key] ?? acc.max) : exp.last_metrics[metricId]?.[variantId]?.[this.valuesMode.key]
            };
          }, {values: {}} as { metric, variant, firstMetricRow: boolean, lastInGroup: boolean, min: number, max: number, values: Record<string, Task['last_metrics']> })
        };
      })).flat(1);

      if (!this.settings) {
        this.settings = this.originalSelection ?
          {...this.initialSettings, selectedMetricsScalar: this.originalSelection} :
          {...this.initialSettings};
      }
      if (!this.settings.selectedMetricsScalar || this.settings.selectedMetricsScalar?.length === 0) {
        this.settings.selectedMetricsScalar = this.getFirstMetrics(10);
      } else {
        const newVariantsToSelect = [];
        Object.entries(this.metricVariantList).forEach(([metric, variant]) => {
          if (this.settings.selectedMetricsScalar.includes(metric) && this.settings.selectedMetricsScalar.filter(a => a.startsWith(metric)).length === 1) {
            Object.keys(variant).map(variantName => metric + variantName).forEach(variantPath => {
              if (!this.settings.selectedMetricsScalar.includes(variantPath)) {
                newVariantsToSelect.push(variantPath);
              }
            });
          }
        });
        this.settings = {...this.settings, selectedMetricsScalar: [...this.settings.selectedMetricsScalar, ...newVariantsToSelect]};
      }
      this.filter(this.filterValue);
    }
  }

  filter = (value: string) => {
    if (!this.dataTable) {
      return;
    }
    const lowerVal = value.toLowerCase();
    this.dataTableFiltered = this.dataTable
      .filter(row => this.settings.selectedMetricsScalar?.includes(row.metric + row.variant))
      .filter(row => row.metric.toLowerCase().includes(lowerVal) || row.variant.toLowerCase().includes(lowerVal));
    this.showFilterTooltip = true;
    this.dataTableFiltered.forEach((row, i) => {
      row.firstMetricRow = row.metric !== this.dataTableFiltered[i - 1]?.metric;
      row.lastInGroup = row.metric !== this.dataTableFiltered[i + 1]?.metric;
    });
    if (this.table()) {
      window.setTimeout(() => this.table().scroller?.setSize(), 50);
    }
  };

  private getExperimentIdsParams(experiments: { id?: string }[]): string {
    return experiments ? experiments.map(e => e.id).toString() : '';
  }

  clear() {
    this.variantFilter.reset('');
  }

  searchTermChanged(searchTerm: string) {
    this.listSearchTerm = searchTerm;
  }

  selectedMetricsChanged(selectedMetrics: string[]) {
    this.settings = {...this.settings, selectedMetricsScalar: selectedMetrics};
    this.filter(this.filterValue);
  }

  exportToCSV() {
    const headers = this.experiments.map(ex => ex.name);
    const options = mkConfig({
      filename: `Scalars compare table`,
      showColumnHeaders: true,
      columnHeaders: ['Metric', 'Variant'].concat(headers)
    });
    const csv = generateCsv(options)(this.dataTableFiltered.map(row => {
      const values = Object.values(row.values).map(value => value?.[this.valuesMode.key] ?? '');
      return {
        Metric: row.metric,
        Variant: row.variant,
        ...headers.reduce((acc, header, i) => {
          acc[header] = typeof values[i]=== 'string' ?
            sanitizeCSVCell(values[i].replace(/\r?\n|\r/g, '')) :
            values[i];
          return acc;
        }, {})
      };
    }));
    download(options)(csv);
  }

  trackByFunction(index: number, item) {
    return item?.id || item?.name || index;
  }

  showAll() {
    const firstSelectedMetrics = this.getFirstMetrics(10);
    this.settings = {...this.settings, selectedMetricsScalar: this.originalSelection.length > 0 ? this.originalSelection : firstSelectedMetrics};
    this.filter(this.filterValue);
  }

  private getFirstMetrics(number: number) {
    const sortedMetrics = Object.entries(this.metricVariantList).sort((a, b) => a[0] > b[0] ? -1 : 1);
    return sortedMetrics.map(([metric, variants]) => {
      const sortedVariants = Object.keys(variants).sort();
      return sortedVariants.map(variant => metric + variant);
    }).flat().slice(0, number);
  }

  private saveSettingsState() {
    if (!isEqual(this.settings.selectedMetricsScalar, this.originalSelection)) {
      this.store.dispatch(setExperimentSettings({id: this.taskIds, changes: {selectedMetricsScalar: this.settings.selectedMetricsScalar}}));
    }
  }
}
