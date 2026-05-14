import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Component, computed, effect, inject, linkedSignal, signal, untracked} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  selectEntitiesFailedToDelete,
  selectFilesFailedToDelete,
  selectNumberOfSourcesToDelete
} from './common-delete-dialog.reducer';
import {deleteEntities, resetDeleteState} from './common-delete-dialog.actions';
import {getDeleteProjectPopupStatsBreakdown} from '~/features/projects/projects-page.utils';
import {EntityTypeEnum, hideDeleteArtifactsEntities} from '~/shared/constants/non-common-consts';
import {CommonReadyForDeletion} from '@common/projects/common-projects.reducer';
import DOMPurify from 'dompurify';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatCheckbox} from '@angular/material/checkbox';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {SlicePipe} from '@angular/common';

export interface DeleteData {
  numSelected: number;
  entity: { id: string; name?: string };
  entityType: EntityTypeEnum;
  projectStats?: CommonReadyForDeletion;
  useCurrentEntity?: boolean;
  includeChildren?: boolean;
  resetMode?: boolean;
  devWarning?: boolean;
}

@Component({
  selector: 'sm-delete-dialog',
  templateUrl: './common-delete-dialog.component.html',
  styleUrls: ['./common-delete-dialog.component.scss'],
  imports: [
    DialogTemplateComponent,
    CopyClipboardComponent,
    MatIcon,
    MatProgressBar,
    MatCheckbox,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    FormsModule,
    MatButton,
    SlicePipe
  ]
})
export class CommonDeleteDialogComponent {
  protected data = inject<DeleteData>(MAT_DIALOG_DATA);
  protected dialogRef = inject(MatDialogRef<CommonDeleteDialogComponent>);
  private store = inject(Store);

  protected readonly entityName: string;
  protected readonly resetMode = this.data.resetMode;
  protected readonly devWarning = this.data.devWarning;
  protected readonly entityType = this.data.entityType;
  protected readonly numSelected = this.data.numSelected;
  protected readonly header = `${this.data.resetMode ? 'Reset' : 'Delete'} ${this.data.entityType}${this.data.numSelected > 1 ? 's' : ''}`;
  protected readonly bodyMessage = this.getMessageByEntity(this.data.entityType, this.data.projectStats);
  protected readonly useCurrentEntity = this.data.useCurrentEntity;
  protected readonly entity = this.data.entity;
  protected readonly includeChildren = this.data.includeChildren;
  protected readonly hideDeleteArtifacts = hideDeleteArtifactsEntities.includes(this.data.entityType);
  protected inProgress = signal(false);
  protected totalFilesNumber = signal(null);
  protected showFinishMessage = signal(false);
  protected deleteArtifacts = signal(true);

  protected filesNumber = this.store.selectSignal(selectNumberOfSourcesToDelete);
  protected failedFiles = this.store.selectSignal(selectFilesFailedToDelete);
  protected failedEntities = this.store.selectSignal(selectEntitiesFailedToDelete)

  protected isOpen = linkedSignal(() => !!this.failedFiles().length);
  protected noFilesToDelete = computed(() => Number.isInteger(this.totalFilesNumber()) && this.totalFilesNumber() === 0);
  protected progressPercent = computed(() => this.noFilesToDelete() ? 100 :
    Math.round((this.totalFilesNumber() - this.filesNumber()) / this.totalFilesNumber() * 100) || 0
  );
  protected isOpenEntities = linkedSignal(() => !!this.failedEntities().length);


  constructor() {
    const name = DOMPurify.sanitize(this.data.entity?.name);
    this.entityName = this.data.numSelected === 1 ?
      this.data.entityType === EntityTypeEnum.project ? name.split('/').pop() : name :
      `${this.data.numSelected} ${this.data.entityType}s`;

    const firstTimeEffect = effect(() => {
      if (this.firstTime(this.filesNumber())) {
        this.totalFilesNumber.set(this.filesNumber());
        firstTimeEffect.destroy();
      }
    });

    effect(() => {
      if (this.progressPercent() > 99) {
        untracked(() => {
          if (this.failedFiles()?.length > 0 || this.isOpenEntities()) {
            window.setTimeout(() => this.showFinishMessage.set(true), 1000);
          } else {
            this.closeDialog(true);
          }
        })
      }
    });
  }

  closeDialog(isConfirmed) {
    if (isConfirmed) {
      this.store.dispatch(resetDeleteState());
      this.dialogRef.close(true);
    } else {
      this.dialogRef.close(null);
    }
  }

  delete() {
    this.inProgress.set(true);
    this.store.dispatch(deleteEntities({
      entityType: this.entityType,
      entity: this.useCurrentEntity && this.entity,
      includeChildren: this.includeChildren,
      deleteArtifacts: this.deleteArtifacts(),
      resetMode: this.resetMode
    }));
  }

  openToggle() {
    this.isOpen.update(open => !open);
  }

  openToggleEntities() {
    this.isOpenEntities.update(open => !open);
  }

  getMessageByEntity(entityType: EntityTypeEnum, stats?: CommonReadyForDeletion) {
    switch (entityType) {
      case EntityTypeEnum.controller:
      case EntityTypeEnum.experiment:
        return 'This will also remove all captured logs, results, artifacts and debug samples.';
      case EntityTypeEnum.model:
        return 'This will also remove the model weights file. Note: Tasks using deleted models will no longer be able to run.';
      case EntityTypeEnum.project:
        // eslint-disable-next-line no-case-declarations
        const entitiesBreakDown = getDeleteProjectPopupStatsBreakdown(stats, 'total', 'task');
        return entitiesBreakDown.trim().length > 0 ? `${entitiesBreakDown} will be deleted, including their artifacts. This may take a few minutes.` : '';
      case EntityTypeEnum.openDataset: {
        const entitiesBreakDown2 = getDeleteProjectPopupStatsBreakdown(stats, 'total', `version`);
        const single = Object.values(stats).reduce((a, b) => a + (b.total || 0), 0) == 1;
        return entitiesBreakDown2.trim().length > 0 ? `${entitiesBreakDown2} will be deleted and ${single ? 'its' : 'their'}this.data. This may take a few minutes.` : '';
      }
    }
    return '';
  }

  private firstTime(filesNumber: number) {
    return !this.totalFilesNumber() && Number.isInteger(filesNumber);
  }
}
