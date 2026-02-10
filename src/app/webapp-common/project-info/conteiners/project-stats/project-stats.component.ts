import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject, viewChild, input, effect
} from '@angular/core';
import {Store} from '@ngrx/store';
import {getCustomMetrics} from '@common/experiments/actions/common-experiments-view.actions';
import {fetchGraphData, setMetricVariant} from '@common/core/actions/projects.actions';
import {
  ScatterPlotPoint,
  ScatterPlotSeries, selectGraphData,
  selectSelectedMetricVariantForCurrProject, selectSelectedProjectId
} from '@common/core/reducers/projects.reducer';
import {Project} from '~/business-logic/model/projects/project';
import {debounceTime, filter, skip, switchMap, take, tap} from 'rxjs/operators';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {
  MetricForStatsData,
  MetricForStatsDialogComponent
} from '@common/project-info/conteiners/metric-for-stats-dialog/metric-for-stats-dialog.component';
import {ScatterPlotComponent} from '@common/shared/components/charts/scatter-plot/scatter-plot.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {createMetricColumn, MetricColumn} from '@common/shared/utils/tableParamEncode';
import {concatLatestFrom} from '@ngrx/operators';
import {presetColors} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {selectMetricVariants} from '@common/experiments/reducers';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'sm-project-stats',
  templateUrl: './project-stats.component.html',
  styleUrls: ['./project-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ScatterPlotComponent,
    TooltipDirective,
    MatIcon,
    MatButton
  ]
})
export class ProjectStatsComponent implements OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  public selectedVariants: ISmCol[];
  public colors: string[];
  public metricVariantSelection = [];
  public graphData = null as ScatterPlotSeries[];
  public loading = true;
  public gotOptions;
  public variantDisplay = 'Select Metric & Variant';
  private sub = new Subscription();
  states = [
    {label: 'Completed or Stopped', type: TaskStatusEnum.Completed},
    {label: 'Published', type: TaskStatusEnum.Published},
    {label: 'Failed', type: TaskStatusEnum.Failed},
    {label: 'Running', type: TaskStatusEnum.InProgress}
  ] as {label: string; type: string; color?: string}[];

  project = input<Project>();
  plot = viewChild(ScatterPlotComponent);

  constructor() {
    effect(() => {
      if (this.project()) {
        this.gotOptions = undefined;
      }
    });

    this.sub.add(this.store.select(selectSelectedMetricVariantForCurrProject)
      .pipe(concatLatestFrom(() => this.store.select(selectSelectedProjectId)))
      .subscribe(([cols, projectId]) => {
        if (cols && !Array.isArray(cols)) {
          cols = [createMetricColumn(cols as unknown as MetricColumn, projectId)];
        }
        this.selectedVariants = cols;
        if (cols?.length === 1) {
          const data = cols[0];
          this.variantDisplay = data?.header;
        } else if (cols?.length > 1) {
          this.variantDisplay = 'ADD METRICS'
        }
        this.loading = true;
        this.store.dispatch(fetchGraphData());
        this.metricVariantSelection = cols ?? [];
        this.cdr.markForCheck();
      })
    );

    this.sub.add(this.store.select(selectGraphData)
      .pipe(
        debounceTime(0),
        filter((values) => !!values)
      )
      .subscribe(values => {
        let grouped: Record<string, ScatterPlotPoint[]>;
        if (this.selectedVariants.length > 1) {
          grouped = values.reduce((acc, point) => {
            this.selectedVariants.find(v => v.id === point.variant);
            if(acc[point.variant]) {
              acc[point.variant].push(point);
            } else {
              acc[point.variant] = [point];
            }
            return acc;
          }, {});
        } else {
          grouped = values.reduce((acc, point) => {
            const status = [TaskStatusEnum.Stopped, TaskStatusEnum.Completed].includes(point.status as TaskStatusEnum) ? 'Completed or Stopped' : point.status;
            if(acc[status]) {
              acc[status].push(point);
            } else {
              acc[status] = [point];
            }
            return acc;
          }, {});
        }
        this.loading = false;
        this.graphData = Object.entries(grouped).map(([group, points]) => ({
          ...(this.selectedVariants.length > 1 ? {
            label: this.selectedVariants.find(v => v.id === group).header,
            backgroundColor: this.variantToColor(group)
          } : {
            label: group,
            backgroundColor: this.statusToColor(group),
          }),
          data: points.map(point => ({
            x: point.x,
            y: point.y,
            id: point.id,
            name: point.name,
            description: `Created By ${point.user}, Finished ${new Date(point.x).toLocaleString()}`,
          })),
        } as ScatterPlotSeries));
        this.cdr.markForCheck();
      })
    );
  }

  selectedMetricToShow(selection: ISmCol[]) {
    if (selection === null || selection?.length === 0) {
      this.store.dispatch(setMetricVariant({projectId: this.project().id, cols: null}));
    } else {
      this.store.dispatch(setMetricVariant({projectId: this.project().id, cols: selection}));
    }
  }

  selectVariant() {
    if(!this.gotOptions) {
      this.gotOptions = false;
      this.store.dispatch(getCustomMetrics({}));
    }
    this.store.select(selectMetricVariants)
      .pipe(
        skip(this.gotOptions ? 0 : 1),
        tap(() => this.gotOptions !== undefined && (this.gotOptions = true)),
        take(1),
        switchMap(variants => this.dialog.open<MetricForStatsDialogComponent, MetricForStatsData, ISmCol[]>(
            MetricForStatsDialogComponent,
            { data: {
                variants,
                metricVariantSelection: this.metricVariantSelection,
                projectId: this.project().id
              }}
          ).afterClosed()
        ),
        filter(selection => !!selection)
      )
      .subscribe(selection => this.selectedMetricToShow(selection));
  }

  public variantToColor(variantName: string) {
    const index = this.selectedVariants.findIndex(v => v.id === variantName);
    return presetColors[index % presetColors.length];
  }

  public statusToColor(status: string) {
    let color: string;

    switch (status) {
      case 'Completed or Stopped':
        color = '#009aff';
        break;
      case TaskStatusEnum.Failed:
        color = '#ff001f';
        break;
      case TaskStatusEnum.Published:
        color = '#d3ff00';
        break;
      case TaskStatusEnum.InProgress:
        color = '#14aa8c';
        break;
      default:
        color = '#50e3c2';
        break;
    }
    return color;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  experimentClicked(experimentId: string) {
    this.router.navigateByUrl(`/projects/${this.project().id}/tasks/${experimentId}`);
  }

  getValueName(valueType: string) {
    switch (valueType) {
      case 'max_value':
        return 'Max';
      case 'min_value':
        return 'Min';
      default:
        return 'Last';
    }
  }
}
