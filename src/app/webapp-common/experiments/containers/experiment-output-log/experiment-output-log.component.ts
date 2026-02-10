import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  selectExperimentBeginningOfLog,
  selectExperimentLog,
  selectLogFilter,
  selectLogLoading,
  selectSelectedExperimentFromRouter
} from '../../reducers';
import {filter} from 'rxjs/operators';
import {last} from 'lodash-es';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import {
  downloadFullLog,
  getExperimentLog,
  resetLogFilter,
  resetOutput,
  setLogFilter
} from '../../actions/common-experiment-output.actions';
import {ExperimentLogInfoComponent} from '../../dumb/experiment-log-info/experiment-log-info.component';
import {RefreshService} from '@common/core/services/refresh.service';
import {activeLoader} from '@common/core/actions/layout.actions';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectThemeMode} from '@common/core/reducers/view.reducer';
import {MatFormField} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {PushPipe} from '@ngrx/component';
import {MatInput} from '@angular/material/input';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {PipelineItem} from '@common/pipelines-controller/pipeline-controller-info/pipeline-controller-info.component';

@Component({
  selector: 'sm-experiment-output-log',
  templateUrl: './experiment-output-log.component.html',
  styleUrls: ['./experiment-output-log.component.scss'],
  imports: [
    ExperimentLogInfoComponent,
    MatFormField,
    MatIcon,
    MatButton,
    TooltipDirective,
    PushPipe,
    MatInput,
    ShowTooltipIfEllipsisDirective
  ]
})
export class ExperimentOutputLogComponent {
  private store = inject(Store);
  private refresh = inject(RefreshService);
  private readonly destroy = inject(DestroyRef);

  showHeader = input(true);
  experiment = input<IExperimentInfo>();
  step = input<PipelineItem>();

  scrolledToBottom = output();


  protected log = this.store.selectSignal(selectExperimentLog);
  protected logBeginning$ = this.store.select(selectExperimentBeginningOfLog);
  protected filter$ = this.store.select(selectLogFilter);
  protected fetching$ = this.store.select(selectLogLoading);

  private selectedExperiment = this.store.selectSignal(selectSelectedExperiment);
  private experimentId = this.store.selectSignal(selectSelectedExperimentFromRouter);
  protected theme = this.store.selectSignal(selectThemeMode);

  protected creator = computed(() => this.log()?.at(-1)?.worker ?? '');
  protected hasLog = computed(() => Array.isArray(this.log()) ? this.log().length > 0 : null);
  private logRef = viewChild(ExperimentLogInfoComponent);
  protected logState = computed(() => ({
    log: this.log(),
    loading: signal(!this.log())
  }));

  protected currExperiment = computed(() => {
    if (this.experiment()) {
      return this.experiment();
    } else {
      if (this.experimentId() === this.selectedExperiment()?.id) {
        return this.selectedExperiment();
      } else if (this.experimentId()) {
        return {id: this.experimentId()};
      } else return null;
    }
  });

  protected currExperimentId = computed((): string => this.currExperiment()?.id);
  protected currExperimentStartedTime = computed(() => this.currExperiment()?.started);
  private prevStartedTime: any;

  constructor() {
    effect(() => {
      if (!this.step() && this.currExperimentId() === this.selectedExperiment()?.id) {
        untracked(() => {
          this.fetchLog(this.currExperimentId());
        });
      }
    });

    effect(() => {
      if (this.currExperimentId()) {
        this.prevStartedTime = null;
      }
    });

    effect(() => {
      if (this.step() && this.step().data.job_id === this.currExperimentId()) {
        untracked(() => {
          this.fetchLog((this.currExperimentId()));
        });
      }
    });

    effect(() => {
      if (this.currExperimentStartedTime() && !this.prevStartedTime) {
        this.prevStartedTime = this.currExperimentStartedTime();
      } else if (this.prevStartedTime && this.currExperimentStartedTime() && this.currExperimentStartedTime() !== this.prevStartedTime) {
        untracked(() => {
          this.fetchLog(this.currExperimentId());
          this.prevStartedTime = this.currExperimentStartedTime();
        });
      }
    });


    this.refresh.tick
      .pipe(
        takeUntilDestroyed(),
        filter(autoRefresh => autoRefresh !== null && !this.logState().loading() && !!this.currExperiment()?.id && (!this.logRef() || this.logRef().atEnd || autoRefresh === false)))
      .subscribe(autoRefresh => this.store.dispatch(getExperimentLog({
        id: this.currExperiment().id,
        ...(autoRefresh && {
          direction: autoRefresh ? 'next' : 'prev',
          from: last(this.logRef()?.orgLogs)?.timestamp,
          autoRefresh: true
        }),
      })));

    this.destroy.onDestroy(() => {
      this.store.dispatch(resetLogFilter());
      this.store.dispatch(resetOutput());
    });
  }


  fetchLog(id: string) {
    this.logState().loading.set(true);
    this.store.dispatch(resetOutput());
    this.logRef()?.reset();
    if (id) {
      this.store.dispatch(activeLoader(getExperimentLog.type));
      this.store.dispatch(getExperimentLog({id, direction: null}));
    }
  }

  public filterLog(event: KeyboardEvent) {
    this.store.dispatch(setLogFilter({filter: (event.target as HTMLInputElement).value}));
  }

  getLogs({direction, from}: { direction: string; from?: number }) {
    this.store.dispatch(getExperimentLog({id: this.currExperiment().id, direction, from, refresh: !from}));
    this.logState().loading.set(true);
  }

  downloadLog() {
    this.store.dispatch(downloadFullLog({experimentId: this.currExperiment().id}));
  }
}
