import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Task} from '~/business-logic/model/tasks/task';
import {
  selectEntitiesFailedToDelete,
  selectFilesFailedToDelete,
  selectNumberOfSourcesToDelete
} from './common-delete-dialog.reducer';
import {Observable, Subject} from 'rxjs';
import {deleteEntities, resetDeleteState} from './common-delete-dialog.actions';
import {getDeleteProjectPopupStatsBreakdown} from '~/features/projects/projects-page.utils';
import {EntityTypeEnum, hideDeleteArtifactsEntities} from '~/shared/constants/non-common-consts';
import {takeUntil, tap} from 'rxjs/operators';
import {CommonReadyForDeletion} from '@common/projects/common-projects.reducer';
import DOMPurify from 'dompurify';

export interface DeleteData {
  numSelected: number;
  entity: {id: string; name?: string};
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
    standalone: false
})
export class CommonDeleteDialogComponent implements OnInit, OnDestroy {

  private unsubscribe$ = new Subject<boolean>();
  public header: string;
  public filesNumber$: Observable<number>;
  public entityName: string;
  public failedFiles$: Observable<string[]>;
  public failedEntities$: Observable<{ id: string; name: string; message: string }[]>;
  public inProgress = false;
  public totalFilesNumber: number;
  public progressPercent: number;
  public noFilesToDelete: boolean;
  public isOpen: boolean;
  public isOpenEntities: boolean;
  public entityType: EntityTypeEnum;
  public numSelected: number;
  public bodyMessage: string;
  public showFinishMessage = false;
  private readonly useCurrentEntity: boolean;
  private readonly entity: Task;
  public failedFiles: string[];
  private readonly includeChildren: boolean;
  public deleteArtifacts = true;
  public resetMode: boolean;
  public devWarning: boolean;
  public hideDeleteArtifacts: boolean;


  constructor(
    private store: Store,
    @Inject(MAT_DIALOG_DATA) data: DeleteData,
    public dialogRef: MatDialogRef<CommonDeleteDialogComponent>
  ) {
    this.filesNumber$ = this.store.select(selectNumberOfSourcesToDelete);
    this.failedFiles$ = this.store.select(selectFilesFailedToDelete).pipe(tap(failed => this.isOpen = !!failed.length));
    this.failedEntities$ = this.store.select(selectEntitiesFailedToDelete).pipe(tap(failed => this.isOpenEntities = !!failed.length));
    this.resetMode = data.resetMode;
    this.devWarning = data.devWarning;
    this.entityType = data.entityType;
    this.hideDeleteArtifacts = hideDeleteArtifactsEntities.includes(data.entityType);
    this.numSelected = data.numSelected;
    const name = DOMPurify.sanitize(data.entity?.name);
    this.entityName = data.numSelected === 1 ?
      data.entityType === EntityTypeEnum.project ? name.split('/').pop() : name :
      `${data.numSelected} ${data.entityType}s`;
    this.header = `${data.resetMode ? 'Reset' : 'Delete'} ${data.entityType}${data.numSelected > 1 ? 's' : ''}`;
    this.bodyMessage = this.getMessageByEntity(data.entityType, data.projectStats);
    this.useCurrentEntity = data.useCurrentEntity;
    this.entity = data.entity;
    this.includeChildren = data.includeChildren;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true);
  }

  ngOnInit(): void {
    this.filesNumber$.pipe(takeUntil(this.unsubscribe$)).subscribe(filesNumber => {
      if (this.firstTime(filesNumber)) {
        this.noFilesToDelete = filesNumber === 0;
        this.totalFilesNumber = filesNumber;
      }
      this.progressPercent = this.noFilesToDelete ? 100 : Math.round((this.totalFilesNumber - filesNumber) / this.totalFilesNumber * 100) || 0;
      if (this.progressPercent > 99) {
        if (this.failedFiles?.length > 0 || this.isOpenEntities) {
          window.setTimeout(() => this.showFinishMessage = true, 1000);
        } else {
          this.closeDialog(true);
        }
      }
    });

    this.failedFiles$.pipe(takeUntil(this.unsubscribe$)).subscribe(files => {
      this.failedFiles = files;
    });
  }

  private firstTime(filesNumber: number) {
    return !this.totalFilesNumber && Number.isInteger(filesNumber);
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
    this.inProgress = true;
    this.store.dispatch(deleteEntities({
      entityType: this.entityType,
      entity: this.useCurrentEntity && this.entity,
      includeChildren: this.includeChildren,
      deleteArtifacts: this.deleteArtifacts,
      resetMode: this.resetMode
    }));
  }

  openToggle() {
    this.isOpen = !this.isOpen;
  }

  openToggleEntities() {
    this.isOpenEntities = !this.isOpenEntities;
  }

  getMessageByEntity(entityType: EntityTypeEnum, stats?: CommonReadyForDeletion) {
    switch (entityType as any) {
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
        return entitiesBreakDown2.trim().length > 0 ? `${entitiesBreakDown2} will be deleted and ${single ? 'its' : 'their'} data. This may take a few minutes.` : '';
      }
    }
    return '';
  }
}
