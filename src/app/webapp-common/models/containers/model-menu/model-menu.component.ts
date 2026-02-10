import {Component, input, output, inject, computed} from '@angular/core';
import {
  archiveSelectedModels,
  changeProjectRequested,
  publishModelClicked,
  restoreSelectedModels
} from '../../actions/models-menu.actions';
import {htmlTextShort} from '@common/shared/utils/shared-utils';
import {ICONS} from '@common/constants';
import {MatDialog} from '@angular/material/dialog';
import {AdminService} from '~/shared/services/admin.service';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {filter, map, take} from 'rxjs/operators';
import {
  MoveProjectData,
  MoveProjectDialogComponent
} from '@common/experiments/shared/components/move-project-dialog/move-project-dialog.component';
import {
  fetchModelsRequested,
  modelSelectionChanged,
  setSelectedModels,
  setTableMode
} from '../../actions/models-view.actions';
import {SelectedModel} from '../../shared/models.model';
import {
  CommonDeleteDialogComponent,
  DeleteData
} from '@common/shared/entity-page/entity-delete/common-delete-dialog.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {cancelModelEdit} from '../../actions/models-info.actions';
import {BaseContextMenuComponent} from '@common/shared/components/base-context-menu/base-context-menu.component';
import {
  selectionDisabledArchive,
  selectionDisabledMoveTo,
  selectionDisabledPublishModels
} from '@common/shared/entity-page/items.utils';
import {getSignedUrl} from '@common/core/actions/common-auth.actions';
import {selectSignedUrl} from '@common/core/reducers/common-auth-reducer';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {Project} from '~/business-logic/model/projects/project';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';
import {MatIconModule} from '@angular/material/icon';


@Component({
  selector: 'sm-model-menu',
  templateUrl: './model-menu.component.html',
  styleUrls: ['./model-menu.component.scss'],
  imports: [
    TagsMenuComponent,
    MatIconModule,
    MatIconButton,
    MatMenuTrigger,
    MatMenuItem,
    MatMenu,
    MenuItemTextPipe
  ]
})
export class ModelMenuComponent extends BaseContextMenuComponent {
  protected dialog = inject(MatDialog);
  protected adminService = inject(AdminService);
  readonly icons = ICONS;
  public modelSignedUri: string;

  model = input.required<SelectedModel>();
  selectedModel = input<SelectedModel>();
  selectedModels = input<SelectedModel[]>();
  numSelected = input(0);
  projectTags = input<string[]>();
  companyTags = input<string[]>();
  tagsFilterByProject = input<boolean>();
  activateFromMenuButton = input(true);
  useCurrentEntity = input(false);
  tagSelected = output<string>();

  protected isExample = computed(() => isReadOnly(this.model()));
  protected isLocalFile = computed(() => this.adminService.isLocalFile(this.model()?.uri));
  protected isArchive = computed(() => this.model()?.system_tags?.includes('archived'));

  archiveClicked() {
    // info header case
    const selectedModels = this.selectedModels() ? selectionDisabledArchive(this.selectedModels()!).selectedFiltered : [this.model()];
    if (selectedModels[0].system_tags?.includes('archived')) {
      this.store.dispatch(restoreSelectedModels({selectedEntities: selectedModels, skipUndo: false}));
    } else {
      this.store.dispatch(archiveSelectedModels({selectedEntities: selectedModels, skipUndo: false}));
    }
  }

  public publishPopup() {
    const selectedModels = this.selectedModels() ? selectionDisabledPublishModels(this.selectedModels()!).selectedFiltered : [this.model()];

    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'PUBLISH',
        body: `<b>${selectedModels.length === 1 ? htmlTextShort(selectedModels[0].name) : selectedModels.length + ' models'}</b> status will be set to Published.
<br><br>Published models are read-only and cannot be reset.`,
        yes: 'Publish',
        no: 'Cancel',
        iconClass: 'al-ico-upload',
      }
    });

    confirmDialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.publishModel(selectedModels);
      }
    });
  }

  publishModel(selectedModels: SelectedModel[]) {
    this.store.dispatch(publishModelClicked({selectedEntities: selectedModels}));
  }

  public moveToProjectPopup() {
    const selectedModels = this.selectedModels() ? selectionDisabledMoveTo(this.selectedModels()!).selectedFiltered : [this.model()];
    const currentProjects = Array.from(new Set(selectedModels.map(exp => exp.project?.id).filter(p => p)));
    this.dialog.open<MoveProjectDialogComponent, MoveProjectData, Project>(MoveProjectDialogComponent, {
      data: {
        currentProjects: currentProjects.length > 0 ? currentProjects : [selectedModels[0].project?.id],
        defaultProject: selectedModels[0].project,
        reference: selectedModels.length > 1 ? selectedModels : selectedModels[0]?.name,
        type: EntityTypeEnum.model
      }
    }).afterClosed()
      .pipe(
        take(1),
        filter(project => !!project)
      )
      .subscribe(project => this.store.dispatch(changeProjectRequested({selectedModels, project})));
  }

  public downloadModelFileClicked = () => {
    const url = this.model().uri;
    this.store.dispatch(getSignedUrl({url}));
    this.store.select(selectSignedUrl(url))
      .pipe(
        filter(signed => !!signed?.signed),
        map(({signed: signedUrl}) => signedUrl),
        take(1)
      ).subscribe(signed => {
      const a = document.createElement('a') as HTMLAnchorElement;
      a.target = '_blank';
      a.href = signed;
      a.click();
    });
  };

  public downloadModelFile = () => {
    const a = document.createElement('a') as HTMLAnchorElement;
    a.target = '_blank';
    a.href = this.modelSignedUri;
    a.click();
  };

  deleteModelPopup() {
    const confirmDialogRef =     this.dialog.open<CommonDeleteDialogComponent, DeleteData, boolean>(CommonDeleteDialogComponent, {
      data: {
        entity: this.model(),
        numSelected: this.numSelected(),
        entityType: EntityTypeEnum.model,
        useCurrentEntity: this.activateFromMenuButton() || this.useCurrentEntity()
      },
      width: '600px',
      disableClose: true
    });
    confirmDialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(setSelectedModels({models: []}));
        this.store.dispatch(modelSelectionChanged({model: null, project: this.projectId() || this.model()?.project?.id || '*'}));
        this.store.dispatch(fetchModelsRequested());
        this.store.dispatch(cancelModelEdit());
      }
    });
  }

  toggleDetails() {
    this.store.dispatch(setTableMode({mode:'info'}));
    this.store.dispatch(modelSelectionChanged({
      model: this.model(),
      project: this.projectId()
    }));
  }
}
