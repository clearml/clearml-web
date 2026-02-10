import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectIsModelSaving, selectSelectedModel} from '../../reducers';
import {activateModelEdit, cancelModelEdit, editModel, setSavingModel} from '../../actions/models-info.actions';
import {selectIsSharedAndNotOwner} from '~/features/experiments/reducers';
import {
  ModelInfoLabelsViewComponent
} from '@common/models/dumbs/model-info-labels-view/model-info-labels-view.component';

@Component({
  selector: 'sm-model-info-labels',
  templateUrl: './model-info-labels.component.html',
  styleUrls: ['./model-info-labels.component.scss'],
  imports: [
    ModelInfoLabelsViewComponent
  ]
})
export class ModelInfoLabelsComponent {

  private  store = inject(Store);
  protected selectedModel = this.store.selectSignal(selectSelectedModel);
  protected saving         = this.store.selectSignal(selectIsModelSaving);
  protected isSharedAndNotOwner = this.store.selectSignal(selectIsSharedAndNotOwner);

  saveFormData(changedModel) {
    this.store.dispatch(setSavingModel (true));
    this.store.dispatch(editModel({model: changedModel}));
  }
  cancelClicked() {
    this.store.dispatch(cancelModelEdit());
  }

  activateEditClicked() {
    this.store.dispatch(activateModelEdit('labels'));
  }
}
