import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ExperimentMenuComponent} from '@common/experiments/shared/components/experiment-menu/experiment-menu.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';
import {MatIconModule} from '@angular/material/icon';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {RenameDialogComponent} from '@common/shared/ui-components/overlay/rename-dialog/rename-dialog.component';
import {saveHyperParamsSection} from '@common/experiments/actions/common-experiments-info.actions';
import {selectionDisabledPublishExperiments} from '@common/shared/entity-page/items.utils';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';

@Component({
  selector: 'sm-open-dataset-version-menu',
  templateUrl: './open-dataset-version-menu.component.html',
  styleUrls: ['../../experiments/shared/components/experiment-menu/experiment-menu.component.scss', './open-dataset-version-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagsMenuComponent,
    MatIconModule,
    MatMenuTrigger,
    MatMenuItem,
    MatMenu,
    MenuItemTextPipe,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective
  ]
})
export class OpenDatasetVersionMenuComponent extends ExperimentMenuComponent {
  entityTypeEnum = EntityTypeEnum;
  public changeVersion() {
    const selectedExperiments = this.experiment() ?? this.selectedExperiments()[0];

    this.dialog.open<RenameDialogComponent>(RenameDialogComponent,{
      data:{name: selectedExperiments.hyperparams?.properties?.version?.value,
        iconClass: 'al-ico-edit',
        header:'EDIT VERSION',
        fieldName: 'Version',
        patternError: 'Version should follow Semantic Versioning format (MAJOR.MINOR.PATCH)',
        pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$' },
    }).afterClosed().subscribe((res) => {
      if (res) {
        this.store.dispatch(saveHyperParamsSection({task: selectedExperiments as  ISelectedExperiment, hyperparams: [{name: 'version', section: 'properties', value: res.name}]}));
      }
    })
  }
  override publishPopup() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledPublishExperiments(this.selectedExperiments()).selectedFiltered : [this.experiment()];

    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig<{
      $implicit: ISelectedExperiment[]
    }>, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'PUBLISH DATASET VERSION',
        template: this.publishTemplate(),
        templateContext: {$implicit: selectedExperiments},
        yes: 'Publish',
        no: 'Cancel',
        iconClass: 'al-ico-publish',
      },
      panelClass: 'dialog-md'
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.publishExperiment(selectedExperiments);
      }
    });
  }
}
