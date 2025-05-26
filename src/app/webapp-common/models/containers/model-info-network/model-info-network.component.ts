import {Component, effect, inject, linkedSignal} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectIsModelSaving, selectModelId, selectSelectedModel} from '../../reducers';
import {activateModelEdit, cancelModelEdit, editModel, setSavingModel } from '../../actions/models-info.actions';
import {selectIsSharedAndNotOwner} from '~/features/experiments/reducers';
import {computedPrevious} from 'ngxtension/computed-previous';

@Component({
    selector: 'sm-model-info-network',
    templateUrl: './model-info-network.component.html',
    styleUrls: ['./model-info-network.component.scss'],
    standalone: false
})
export class ModelInfoNetworkComponent {
  private store = inject(Store);

  private selectedModel = this.store.selectSignal(selectSelectedModel);
  protected isSharedAndNotOwner = this.store.selectSignal(selectIsSharedAndNotOwner);
  protected saving         = this.store.selectSignal(selectIsModelSaving);
  private selectedModelFromRouter = this.store.selectSignal(selectModelId);
  private selectedModelFromRouterP = computedPrevious(this.selectedModelFromRouter);
  protected model = linkedSignal(() => this.selectedModel());

  constructor() {
    effect(() => {
      if (this.selectedModelFromRouterP() !== this.selectedModelFromRouter()) {
        this.model.set(null);
      }
    });
  }

  saveFormData(changedModel) {
    this.store.dispatch(setSavingModel (true));
    this.store.dispatch(editModel({model: changedModel}));
  }
  cancelClicked() {
    this.store.dispatch(cancelModelEdit());
  }

  activateEditClicked() {
    this.store.dispatch(activateModelEdit('network'));
  }
}
