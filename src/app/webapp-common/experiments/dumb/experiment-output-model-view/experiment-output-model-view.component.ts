import {Component, Input} from '@angular/core';
import {IModelInfo} from '../../shared/common-experiment-model.model';
import {Model} from '~/business-logic/model/models/model';
import {BaseClickableArtifactComponent} from '../base-clickable-artifact.component';


@Component({
    selector: 'sm-experiment-output-model-view',
    templateUrl: './experiment-output-model-view.component.html',
    styleUrls: ['./experiment-output-model-view.component.scss'],
    standalone: false
})
export class ExperimentOutputModelViewComponent extends BaseClickableArtifactComponent {

  public isLocalFile: boolean;
  private _model: IModelInfo;

  @Input() projectId: string;
  @Input() editable: boolean;
  @Input() networkDesign: string;
  @Input() modelLabels: Model['labels'];

  @Input() set model(model: IModelInfo) {
    this._model = model;
    this.isLocalFile = model && model.uri && this.adminService.isLocalFile(model.uri);
  }

  get model(): IModelInfo {
    return this._model;
  }
}
