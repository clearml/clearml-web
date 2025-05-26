import {Component, ElementRef, viewChild, inject, ChangeDetectionStrategy, computed, effect} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  selectExperimentInfoData,
  selectIsExperimentEditable,
  selectSelectedExperiment
} from '~/features/experiments/reducers';
import {experimentDetailsUpdated} from '../../actions/common-experiments-info.actions';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {selectEditingDescription, selectSelectedExperimentFromRouter} from '@common/experiments/reducers';
import {
  ExperimentDetailsComponent
} from '@common/experiments/dumb/experiment-details/experiment-details.component';
import {RefreshService} from '@common/core/services/refresh.service';

@Component({
    selector: 'sm-experiment-info-general',
    templateUrl: './experiment-info-general.component.html',
    styleUrls: ['./experiment-info-general.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExperimentInfoGeneralComponent {
  protected store = inject(Store);
  protected readonly ref = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  protected refresh = inject(RefreshService);

  protected experimentInfoData = this.store.selectSignal(selectExperimentInfoData);
  protected editable           = this.store.selectSignal(selectIsExperimentEditable);
  protected selectedExperiment = this.store.selectSignal(selectSelectedExperiment);
  protected selectedExperimentId = this.store.selectSignal(selectSelectedExperimentFromRouter);
  protected isExample = computed(() => isReadOnly(this.selectedExperiment()));
  private editDesc = this.store.selectSignal(selectEditingDescription);

  protected info = viewChild(ExperimentDetailsComponent);

  constructor() {
    effect(() => {
      if(this.editDesc() && this.info()?.experimentDescriptionSection()) {
        this.ref.nativeElement.scrollTo({top: 370, behavior: 'smooth'});
        this.info()?.experimentDescriptionSection().editModeChanged(true);
      }
    });
  }

  commentChanged(comment) {
    this.store.dispatch(experimentDetailsUpdated({id: this.selectedExperimentId(), changes: {comment}}));
  }
}
