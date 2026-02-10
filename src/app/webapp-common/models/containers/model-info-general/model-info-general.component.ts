import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectSelectedModel} from '../../reducers';
import {isExample} from '@common/shared/utils/shared-utils';
import {updateModelDetails} from '../../actions/models-info.actions';
import {ModelsModule} from '@common/models/models.module';
import {ModelGeneralInfoComponent} from '@common/models/dumbs/model-general-info/model-general-info.component';


@Component({
  selector: 'sm-model-info-general',
  templateUrl: './model-info-general.component.html',
  styleUrls: ['./model-info-general.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModelsModule,
    ModelGeneralInfoComponent
  ]
})
export class ModelInfoGeneralComponent {
  private store = inject(Store);

  protected selectedModel = this.store.selectSignal(selectSelectedModel);
  protected isExample = computed(() => isExample(this.selectedModel()));

  commentChanged(comment) {
    this.store.dispatch(updateModelDetails({id: this.selectedModel().id, changes: {comment}}));
  }
}
