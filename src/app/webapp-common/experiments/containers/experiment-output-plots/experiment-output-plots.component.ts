import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {addMessage} from '@common/core/actions/layout.actions';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {RefreshService} from '@common/core/services/refresh.service';
import {ExperimentGraphsComponent} from '@common/shared/experiment-graphs/experiment-graphs.component';
import {ExtFrame} from '@common/shared/single-graph/plotly-graph-base';
import {convertPlots, ExtMetricsPlotEvent, groupIterations} from '@common/tasks/tasks.utils';
import {Store} from '@ngrx/store';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, distinctUntilKeyChanged, filter, map, tap} from 'rxjs/operators';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {
  experimentPlotsRequested,
  resetExperimentMetrics,
  setChartSettings,
  setExperimentMetricsSearchTerm,
  setExperimentSettings
} from '../../actions/common-experiment-output.actions';
import {
  selectExperimentInfoPlots,
  selectExperimentMetricsSearchTerm,
  selectIsExperimentInProgress,
  selectSelectedSettingsHiddenPlot,
  selectSplitSize
} from '../../reducers';
import {GroupedList} from '@common/tasks/tasks.model';
import {ExperimentSettings} from '@common/experiments/reducers/experiment-output.reducer';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';
import {
  SelectableGroupedFilterListComponent
} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from '@angular/material/sidenav';
import {MatButton, MatIconButton} from '@angular/material/button';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconModule} from '@angular/material/icon';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';

@Component({
  selector: 'sm-experiment-output-plots',
  templateUrl: './experiment-output-plots.component.html',
  styleUrls: ['./experiment-output-plots.component.scss', '../experiment-output-scalars/shared-experiment-output.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectableGroupedFilterListComponent,
    SingleGraphStateModule,
    MatIconModule,
    MatDrawerContent,
    MatDrawer,
    MatIconButton,
    PushPipe,
    MatButton,
    TooltipDirective,
    MatDrawerContainer,
    ExperimentGraphsComponent
  ]
})
export class ExperimentOutputPlotsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isDatasetVersionPreview = false;
  @Input() selected: { id: string };
  @ViewChild(ExperimentGraphsComponent) graphsComponent: ExperimentGraphsComponent;
  public plotsList: GroupedList;
  public listOfHidden$: Observable<string[]>;
  public searchTerm$: Observable<string>;
  public minimized = false;
  public graphs: Record<string, ExtFrame[]>;
  public refreshDisabled: boolean;
  public selectIsExperimentPendingRunning: Observable<boolean>;
  public splitSize$: Observable<number>;
  public dark: boolean;
  public selectedMetrics: string[];
  public plotsListLength: number;
  protected projectId = this.store.selectSignal<string>(selectRouterProjectId);
  private experimentId: string;
  private routerParams$: Observable<Record<string, string>>;
  private subs = new Subscription();
  private plots$: Observable<MetricsPlotEvent[]>;
  private originalPlotList: { metric: string; variant: string }[];

  constructor(
    private store: Store,
    private activeRoute: ActivatedRoute,
    private changeDetection: ChangeDetectorRef,
    private reportEmbed: ReportCodeEmbedService,
    protected refreshService: RefreshService
  ) {
    this.searchTerm$ = this.store.select(selectExperimentMetricsSearchTerm);
    this.splitSize$ = this.store.select(selectSplitSize);
    this.listOfHidden$ = this.store.select(selectSelectedSettingsHiddenPlot);
    this.plots$ = this.store.select(selectExperimentInfoPlots).pipe(
      filter((metrics) => !!metrics),
      tap((list: MetricsPlotEvent[]) => {
        this.originalPlotList = list.map((plot) => ({
          metric: plot.metric,
          variant: plot.variant
        }));
      })
    );

    this.routerParams$ = this.store.select(selectRouterParams)
      .pipe(
        filter(params => !!params.experimentId && !this.isDatasetVersionPreview),
        distinctUntilChanged()
      );

    this.selectIsExperimentPendingRunning = this.store.select(selectIsExperimentInProgress);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selected && this.experimentId !== changes.selected.currentValue.id) {
      this.dark = true;
      this.experimentId = changes.selected.currentValue.id;
      this.refresh();
    }
  }

  ngOnInit() {
    this.minimized = this.activeRoute.snapshot.routeConfig.data?.minimized;
    this.subs.add(this.store.select(selectExperimentInfoPlots)
      .pipe(
        distinctUntilChanged(),
        filter(metrics => !!metrics),
        map(plots => this.isDatasetVersionPreview ? plots.filter(plot => !plot.metric.startsWith('_')).filter(plot => !['Execution Flow', 'Execution Details'].includes(plot.variant)) : plots)
      )
      .subscribe(metricsPlots => {
        this.refreshDisabled = false;
        const groupedPlots = groupIterations(metricsPlots);
        this.plotsList = this.getPlotsList(groupedPlots);
        this.plotsListLength = metricsPlots.length;

        const {graphs, parsingError} = convertPlots({plots: groupedPlots, id: this.experimentId});
        this.graphs = graphs;
        if (parsingError) {
          this.store.dispatch(addMessage('warn', `Couldn't read all plots. Please make sure all plots are properly formatted (NaN & Inf aren't supported).`, [], true));
        }
        this.changeDetection.markForCheck();
      }));

    this.subs.add(this.routerParams$
      .subscribe(params => {
        if (!this.experimentId || this.experimentId !== params.experimentId) {
          this.graphs = undefined;
          this.resetMetrics();
          // this.store.dispatch(new ExperimentPlotsRequested(params.experimentId));
          this.store.dispatch(setExperimentMetricsSearchTerm({searchTerm: ''}));
        }
        this.experimentId = params.experimentId;
        this.changeDetection.markForCheck();
      }));

    this.subs.add(this.store.select(selectSelectedExperiment)
      .pipe(
        filter(experiment => !!experiment && !this.isDatasetVersionPreview),
        distinctUntilKeyChanged('id')
      )
      .subscribe(experiment => {
        this.experimentId = experiment.id;
        this.refresh();
        this.changeDetection.markForCheck();
      }));

    this.subs.add(this.refreshService.tick
      .pipe(filter(autoRefresh => autoRefresh !== null && !!this.experimentId))
      .subscribe(() => {
        this.refresh(true);
        this.changeDetection.markForCheck();
      })
    );

    this.subs.add(combineLatest([this.listOfHidden$, this.plots$])
      .subscribe(([hiddenList]) => {
        const selectedMetrics = hiddenList.length === 0 ?
          [...this.originalPlotList] :
          this.originalPlotList.filter(({metric, variant}) => !hiddenList.includes(`${metric}${variant}`));

        const metricsWithoutVariants = selectedMetrics
          .map(({metric}) => metric)
          .filter(m => !!m);

        this.selectedMetrics = Array.from(new Set([
          ...selectedMetrics.map(({metric, variant}) => `${metric}${variant}`),
          ...metricsWithoutVariants
        ]));
        this.changeDetection.markForCheck();
      }));
  }

  ngOnDestroy() {
    this.resetMetrics();
    this.subs.unsubscribe();
    this.resetMetrics();
  }

  getPlotsList(groupedPlots: Record<string, ExtMetricsPlotEvent[]>) {
    return Object.keys(groupedPlots)
      .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))
      .reduce((acc, metric) => {
        acc[metric] = groupedPlots[metric].reduce((acc2, plot) => {
          acc2[plot.variant] = {};
          return acc2;
        }, {});
        return acc;
      }, {} as GroupedList);
  }

  metricSelected(id: string) {
    this.graphsComponent?.scrollToGraph(id, true);
  }

  hiddenListChanged(hiddenList: string[]) {
    const metrics = this.originalPlotList.map(metric => metric.metric);
    const variants = this.originalPlotList.map(metric => `${metric.metric}${metric.variant}`);
    this.store.dispatch(setExperimentSettings({
      id: this.experimentId,
      changes: {
        hiddenMetricsPlot: Array.from(new Set([...metrics, ...variants].filter(metric => !hiddenList.includes(metric))))
      }
    }));
  }

  refresh(autorefresh?: boolean) {
    if (!this.refreshDisabled) {
      this.refreshDisabled = true;
      this.store.dispatch(experimentPlotsRequested({task: this.experimentId, refresh: autorefresh}));
    }
  }

  searchTermChanged(searchTerm: string) {
    this.store.dispatch(setExperimentMetricsSearchTerm({searchTerm}));
  }

  resetMetrics() {
    this.store.dispatch(resetExperimentMetrics());
  }

  createEmbedCode(event: { metrics?: string[]; variants?: string[]; domRect: DOMRect }) {
    this.reportEmbed.createCode({
      type: 'plot',
      objects: [this.experimentId],
      objectType: 'task',
      ...event
    });
  }

  changeChartSettings($event: { id: string; changes: Partial<ExperimentSettings> }) {
    this.store.dispatch(setChartSettings({...$event, projectId: this.projectId()}));
  }

}
