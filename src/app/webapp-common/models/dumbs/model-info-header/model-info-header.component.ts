import {ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild} from '@angular/core';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {Store} from '@ngrx/store';
import {
  selectCompanyTags,
  selectSelectedProjectId,
  selectTagsFilterByProject
} from '@common/core/reducers/projects.reducer';
import {addTag, removeTag} from '../../actions/models-menu.actions';
import {SelectedModel, TableModel} from '../../shared/models.model';
import {getSysTags} from '../../model.utils';
import {activateModelEdit, cancelModelEdit} from '../../actions/models-info.actions';
import {
  MenuItems,
  selectionDisabledArchive,
  selectionDisabledDelete,
  selectionDisabledMoveTo,
  selectionDisabledPublishModels
} from '@common/shared/entity-page/items.utils';
import {addMessage} from '@common/core/actions/layout.actions';
import {MatMenuTrigger} from '@angular/material/menu';
import {selectModelsTags} from '@common/models/reducers';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {PushPipe} from '@ngrx/component';
import {MatIconModule} from '@angular/material/icon';
import {ModelMenuExtendedComponent} from '~/features/models/containers/model-menu-extended/model-menu-extended.component';

@Component({
  selector: 'sm-model-info-header',
  templateUrl: './model-info-header.component.html',
  styleUrls: ['./model-info-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagsMenuComponent,
    ModelMenuExtendedComponent,
    TagListComponent,
    InlineEditComponent,
    IdBadgeComponent,
    OverlayComponent,
    MatIconModule,
    MatMenuTrigger,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    MatIconButton,
    PushPipe
  ]
})
export class ModelInfoHeaderComponent {
  private store = inject(Store);

  public menuPosition = { x: 0, y: 0 };
  protected tagsFilterByProject$ = this.store.select(selectTagsFilterByProject);
  protected projectTags$ = this.store.select(selectModelsTags);
  protected companyTags$ = this.store.select(selectCompanyTags);
  protected selectedProjectId = this.store.selectSignal(selectSelectedProjectId);

  editable = input<boolean>();
  backdropActive = input<boolean>();
  minimized = input<boolean>();
  isSharedAndNotOwner = input<boolean>();
  model = input<TableModel | SelectedModel>();
  modelNameChanged = output<string>();
  closeInfoClicked = output();
  maximizedClicked = output();
  minimizeClicked = output();
  tagMenuTrigger = viewChild<MatMenuTrigger>('tagsMenuTrigger');
  tagMenu = viewChild(TagsMenuComponent);

  protected sysTags = computed(() => getSysTags(this.model() as TableModel));
  protected selectedDisableAvailable = computed(() => ({
    [MenuItems.publish]: selectionDisabledPublishModels([this.model()]),
    [MenuItems.moveTo]: selectionDisabledMoveTo([this.model()]),
    [MenuItems.delete]: selectionDisabledDelete([this.model()]),
    [MenuItems.archive]: selectionDisabledArchive([this.model()])
  }));
  protected allProjects = computed(() => this.selectedProjectId() === '*');

  public onNameChanged(name) {
    this.modelNameChanged.emit(name);
  }

  openTagMenu() {
    if (!this.tagMenu()) {
      return;
    }
    window.setTimeout(() => this.store.dispatch(activateModelEdit('tags')), 200);
    window.setTimeout(() => {
      this.tagMenuTrigger().openMenu();
      this.tagMenu().focus();
    });
  }

  addTag(tag: string) {
    this.store.dispatch(addTag({tag, models: [this.model() as SelectedModel]}));
  }

  removeTag(tag: string) {
    this.store.dispatch(removeTag({tag, models: [this.model() as SelectedModel]}));
  }

  tagsMenuClosed() {
    this.store.dispatch(cancelModelEdit());
    this.tagMenu().clear();
  }

  editExperimentName(edit: boolean) {
    if (edit) {
      this.store.dispatch(activateModelEdit('ModelName'));
    } else {
      this.store.dispatch(cancelModelEdit());
    }
  }

  copyToClipboard() {
    this.store.dispatch(addMessage('success', 'Copied to clipboard'));
  }
}
