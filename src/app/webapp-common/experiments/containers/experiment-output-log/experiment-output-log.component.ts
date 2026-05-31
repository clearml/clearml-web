import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  selectSelectedExperimentFromRouter
} from '../../reducers';
import {filter} from 'rxjs/operators';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import {
  resetOutput,
} from '../../actions/common-experiment-output.actions';
import {ExperimentLogInfoComponent} from '../../dumb/experiment-log-info/experiment-log-info.component';
import {RefreshService} from '@common/core/services/refresh.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectThemeMode} from '@common/core/reducers/view.reducer';
import {MatFormField} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatInput} from '@angular/material/input';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {injectDispatch} from '@ngrx/signals/events';
import {
  experimentOutputLogEvents,
  ExperimentOutputLogStore
} from './experiment-output-log.store';

@Component({
  selector: 'sm-experiment-output-log',
  templateUrl: './experiment-output-log.component.html',
  styleUrls: ['./experiment-output-log.component.scss'],
  providers: [ExperimentOutputLogStore],
  imports: [
    ExperimentLogInfoComponent,
    MatFormField,
    MatIcon,
    MatButton,
    TooltipDirective,
    MatInput,
    ShowTooltipIfEllipsisDirective
  ]
})
export class ExperimentOutputLogComponent {
  private store = inject(Store);
  private refresh = inject(RefreshService);
  private readonly destroy = inject(DestroyRef);
  protected readonly logStore = inject(ExperimentOutputLogStore);
  private readonly dispatcher = injectDispatch(experimentOutputLogEvents);

  showHeader = input(true);
  experiment = input<IExperimentInfo>();

  scrolledToBottom = output();


  protected log = this.logStore.log;
  protected logBeginning = this.logStore.beginningOfLog;
  protected filter = this.logStore.logFilter;
  protected fetching = this.logStore.loading;

  private selectedExperiment = this.store.selectSignal(selectSelectedExperiment);
  private experimentId = this.store.selectSignal(selectSelectedExperimentFromRouter);
  protected theme = this.store.selectSignal(selectThemeMode);

  protected creator = this.logStore.creator;
  protected hasLog = this.logStore.hasLog;
  private logRef = viewChild(ExperimentLogInfoComponent);
  protected logState = computed(() => ({
    log: this.log(),
    loading: this.fetching
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

  protected currExperimentId = computed((): string => this.experiment()?.id ?? this.experimentId());
  protected currExperimentStartedTime = computed(() => this.currExperiment()?.started);
  private prevStartedTime: string;

  constructor() {
    effect(() => {
      if (this.currExperimentId()) {
        this.prevStartedTime = null;
        untracked(() => {
          this.fetchLog(this.currExperimentId());
        });
      } else {
        untracked(() => {
          this.dispatcher.resetLog();
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
      .subscribe(() => this.dispatcher.getLogs({
          id: this.currExperiment().id,
          direction: 'prev',
          refresh: true
        })
);

    this.destroy.onDestroy(() => {
      this.dispatcher.resetLog();
      this.store.dispatch(resetOutput());
    });
  }


  fetchLog(id: string) {
    this.store.dispatch(resetOutput());
    this.dispatcher.getLogs({id, direction: null});
    this.logRef()?.reset();
  }

  public filterLog(event: KeyboardEvent) {
    this.dispatcher.setLogFilter({filter: (event.target as HTMLInputElement).value});
  }

  getLogs({direction, from}: { direction: string; from?: number }) {
    this.dispatcher.getLogs({id: this.currExperiment().id, direction, from, refresh: !from});
  }

  downloadLog() {
    this.dispatcher.downloadLog({id: this.currExperiment().id});
  }
}
