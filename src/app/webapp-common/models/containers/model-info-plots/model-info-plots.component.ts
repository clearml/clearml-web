import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, viewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, Subject, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, tap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {selectModelPlots, selectSelectedModel, selectSplitSize} from '@common/models/reducers';
import {addMessage} from '@common/core/actions/layout.actions';
import {convertPlots, ExtMetricsPlotEvent, groupIterations} from '@common/tasks/tasks.utils';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {getPlots, setPlots} from '@common/models/actions/models-info.actions';
import {ExperimentGraphsComponent} from '@common/shared/experiment-graphs/experiment-graphs.component';
import {selectModelSettingsHiddenPlot} from '@common/experiments/reducers';
import {isEqual} from 'lodash-es';
import {setChartSettings, setExperimentSettings} from '@common/experiments/actions/common-experiment-output.actions';
import {GroupedList} from '@common/tasks/tasks.model';
import {ExperimentSettings} from '@common/experiments/reducers/experiment-output.reducer';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';
import {
  SelectableGroupedFilterListComponent
} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from '@angular/material/sidenav';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatButton, MatIconButton} from '@angular/material/button';
import {PushPipe} from '@ngrx/component';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-model-info-plot',
  templateUrl: './model-info-plots.component.html',
  styleUrls: [
    './model-info-plots.component.scss',
    '../../../experiments/containers/experiment-output-scalars/shared-experiment-output.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExperimentGraphsComponent,
    SelectableGroupedFilterListComponent,
    MatIconModule,
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    TooltipDirective,
    MatIconButton,
    MatButton,
    PushPipe
  ]
})
export class ModelInfoPlotsComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private activeRoute = inject(ActivatedRoute);
  private reportEmbed = inject(ReportCodeEmbedService);
  private route = inject(ActivatedRoute);

  public graphs: Record<string, any[]>;
  public plotsList$ = new Subject<GroupedList>();
  public plotsList: GroupedList;
  public searchTerm: string;
  public minimized = true;
  public dark = false;
  private sub = new Subscription();
  private refreshDisabled: boolean;
  private modelId: string;
  public selectedMetrics: string[];
  private originalPlotList: { metric: string; variant: string }[];
  protected projectId = this.store.selectSignal<string>(selectRouterProjectId);
  protected splitSize$ = this.store.select(selectSplitSize);
  protected modelsFeature = !!this.route.snapshot?.parent?.parent?.data?.setAllProject;
  protected plots$ = this.store.select(selectModelPlots).pipe(
    filter((metrics) => !!metrics),
    tap((list: MetricsPlotEvent[]) => {
      this.originalPlotList = list.map((plot) => ({
        metric: plot.metric,
        variant: plot.variant
      }));
    })
  );
  protected listOfHidden$ = this.store.select(selectModelSettingsHiddenPlot)
    .pipe(distinctUntilChanged(isEqual));

  graphsComponent = viewChild(ExperimentGraphsComponent);

  ngOnInit(): void {
    this.minimized = this.activeRoute.snapshot.routeConfig.data?.minimized;

    this.sub.add(combineLatest([this.listOfHidden$, this.plots$, this.plotsList$])
      .pipe(filter(() => !!this.plotsList))
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

        this.cdr.markForCheck();
      }));

    this.sub.add(this.store.select(selectSelectedModel)
      .pipe(
        filter(model => !!model),
        distinctUntilChanged()
      )
      .subscribe(model => {
        this.modelId = model.id;
        this.refresh();
      })
    );

    this.sub.add(this.store.select(selectRouterParams)
      .pipe(
        filter(params => !!params.modelId),
        distinctUntilChanged()
      )
      .subscribe(params => {
        if (!this.modelId || this.modelId !== params.modelId) {
          this.graphs = undefined;
          this.resetMetrics();
          this.searchTerm = '';
        }
        this.modelId = params.modelId;
      })
    );

    this.sub.add(this.store.select(selectModelPlots)
      .pipe(
        distinctUntilChanged(),
        filter(metrics => !!metrics)
      )
      .subscribe(metricsPlots => {
        this.refreshDisabled = false;
        const groupedPlots = groupIterations(metricsPlots);
        this.plotsList = this.getPlotsList(groupedPlots);
        this.plotsList$.next(this.plotsList);
        const {graphs, parsingError} = convertPlots({plots: groupedPlots, id: this.modelId});
        this.graphs = graphs;
        if (parsingError) {
          this.store.dispatch(addMessage('warn', `Couldn't read all plots. Please make sure all plots are properly formatted (NaN & Inf aren't supported).`, [], true));
        }
        this.cdr.detectChanges();
      })
    );
  }

  refresh() {
    if (!this.refreshDisabled) {
      this.refreshDisabled = true;
      this.store.dispatch(getPlots({id: this.modelId}));
    }
  }

  getPlotsList(groupedPlots: Record<string, ExtMetricsPlotEvent[]>) {
    return Object.keys(groupedPlots).sort().reduce((acc, metric) => {
      acc[metric] = groupedPlots[metric].reduce((acc2, plot) => {
        acc2[plot.variant] = {};
        return acc2;
      }, {});
      return acc;
    }, {} as GroupedList);
  }

  metricSelected(id: string) {
    this.graphsComponent()?.scrollToGraph(id, true);
  }

  hiddenListChanged(hiddenList: string[]) {
    const metrics = Object.keys(this.plotsList);
    const variants = metrics.map((metric) => Object.keys(this.plotsList[metric]).map(v => metric + v)).flat(2);
    this.store.dispatch(setExperimentSettings({
      id: this.modelId,
      changes: {
        hiddenMetricsPlot: [...metrics, ...variants].filter(metric => !hiddenList.includes(metric))
      }
    }));
  }

  searchTermChanged(searchTerm: string) {
    this.searchTerm = searchTerm;
  }

  resetMetrics() {
    this.store.dispatch(setPlots({plots: null}));
  }

  createEmbedCode(event: { metrics?: string[]; variants?: string[]; domRect: DOMRect }) {
    this.reportEmbed.createCode({
      type: 'plot',
      objects: [this.modelId],
      objectType: 'model',
      ...event
    });
  }

  changeChartSettings($event: { id: string; changes: Partial<ExperimentSettings> }) {
    this.store.dispatch(setChartSettings({...$event, projectId: this.projectId()}));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
