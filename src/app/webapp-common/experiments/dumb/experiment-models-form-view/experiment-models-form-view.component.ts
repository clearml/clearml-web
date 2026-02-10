import {Component, OnDestroy, inject, input, output, computed} from '@angular/core';
import {IModelInfo, IModelInfoSource} from '../../shared/common-experiment-model.model';
import {MatDialog} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';
import {Model} from '~/business-logic/model/models/model';
import {SelectModelComponent, SelectModelData} from '@common/select-model/select-model.component';
import {BaseClickableArtifactComponent} from '../base-clickable-artifact.component';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {resetSelectModelState} from '@common/select-model/select-model.actions';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


@Component({
  selector: 'sm-experiment-models-form-view',
  templateUrl: './experiment-models-form-view.component.html',
  styleUrls: ['./experiment-models-form-view.component.scss'],
  imports: [
    LabeledRowComponent,
    CopyClipboardComponent,
    IdBadgeComponent,
    MatIconModule,
    TooltipDirective,
    MatIconButton
  ]
})
export class ExperimentModelsFormViewComponent extends BaseClickableArtifactComponent implements OnDestroy{
  private dialog = inject(MatDialog);

  projectId = input<string>();
  editable = input<boolean>();
  networkDesign = input<string>();
  modelLabels = input<Model['labels']>();
  source = input<IModelInfoSource>();
  experimentName = input<string>();
  showCreatedExperiment = input(true);
  model = input<IModelInfo>();
  protected isLocalFile = computed(() => this.model() && this.model().uri && this.adminService.isLocalFile(this.model().uri));

  modelSelectedId = output<string>();

  public chooseModel() {
    this.dialog.open<SelectModelComponent, SelectModelData, string>(SelectModelComponent, {
      data: {
        header: 'Select a published model',
        hideShowArchived: true
      },
      panelClass: 'full-screen',
    }).afterClosed()
      .pipe(filter(model => !!model))
      .subscribe((selectedModelId: string) => {
        this.modelSelectedId.emit(selectedModelId);
      });
  }

  removeModel() {
    this.modelSelectedId.emit(null);
  }

  copySuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Copied to clipboard'));
  }

  ngOnDestroy(): void {
    this.store.dispatch(resetSelectModelState({fullReset: true}));
  }
}
