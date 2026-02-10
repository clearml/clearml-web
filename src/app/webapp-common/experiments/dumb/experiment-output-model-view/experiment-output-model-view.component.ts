import {Component, Input} from '@angular/core';
import {IModelInfo} from '../../shared/common-experiment-model.model';
import {Model} from '~/business-logic/model/models/model';
import {BaseClickableArtifactComponent} from '../base-clickable-artifact.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


@Component({
  selector: 'sm-experiment-output-model-view',
  templateUrl: './experiment-output-model-view.component.html',
  styleUrls: ['./experiment-output-model-view.component.scss'],
  imports: [
    CopyClipboardComponent,
    LabeledRowComponent,
    MatIconButton,
    MatIconModule
  ]
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
