import {Component, viewChild, input, output, computed, inject } from '@angular/core';
import {getSystemTags, isDevelopment} from '~/features/experiments/shared/experiments.utils';
import {Store} from '@ngrx/store';
import {selectCompanyTags, selectTagsFilterByProject} from '@common/core/reducers/projects.reducer';
import {addTag, removeTag} from '../../actions/common-experiments-menu.actions';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {activateEdit, deactivateEdit} from '../../actions/common-experiments-info.actions';
import {ExperimentTagsEnum} from '~/features/experiments/shared/experiments.const';
import {EXPERIMENT_COMMENT} from '@common/experiments/dumb/experiment-details/experiment-details.component';
import {ActivatedRoute, Router} from '@angular/router';
import {
  MenuItems,
  selectionDisabledAbort,
  selectionDisabledAbortAllChildren,
  selectionDisabledArchive,
  selectionDisabledDelete,
  selectionDisabledDequeue,
  selectionDisabledEnqueue,
  selectionDisabledMoveTo,
  selectionDisabledPipelineRun,
  selectionDisabledPublishExperiments,
  selectionDisabledQueue,
  selectionDisabledReset,
  selectionDisabledRetry,
  selectionDisabledViewWorker
} from '@common/shared/entity-page/items.utils';
import {addMessage} from '@common/core/actions/layout.actions';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';
import { selectExperimentsTags } from '@common/experiments/reducers';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {
  ExperimentTypeIconLabelComponent
} from '@common/shared/experiment-type-icon-label/experiment-type-icon-label.component';
import {
  ExperimentMenuExtendedComponent
} from '~/features/experiments/containers/experiment-menu-extended/experiment-menu-extended.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {HesitateDirective} from '@common/shared/ui-components/directives/hesitate.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {PushPipe} from '@ngrx/component';
import {
  ExperimentInfoEditDescriptionComponent
} from '@common/experiments/dumb/experiment-info-edit-description/experiment-info-edit-description.component';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-experiment-info-header',
  templateUrl: './experiment-info-header.component.html',
  styleUrls: ['./experiment-info-header.component.scss'],
  imports: [
    ExperimentTypeIconLabelComponent,
    TagsMenuComponent,
    MatMenu,
    ExperimentMenuExtendedComponent,
    TagListComponent,
    InlineEditComponent,
    IdBadgeComponent,
    MatIconModule,
    MatMenuTrigger,
    TooltipDirective,
    HesitateDirective,
    ShowTooltipIfEllipsisDirective,
    MatIconButton,
    PushPipe,
    ExperimentInfoEditDescriptionComponent
  ]
})
export class ExperimentInfoHeaderComponent {
  private store = inject(Store);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  protected tagsFilterByProject$ = this.store.select(selectTagsFilterByProject);
  protected projectTags$ = this.store.select(selectExperimentsTags);
  protected companyTags$ = this.store.select(selectCompanyTags);

  experiment = input<IExperimentInfo>();
  editable = input(true);
  infoData = input<IExperimentInfo>();
  backdropActive = input(false);
  showMenu = input<boolean>();
  minimized = input<boolean>();
  isSharedAndNotOwner = input<boolean>();
  isSharedNotInWorkspaces = input<boolean>();
  experimentNameChanged = output<string>();
  minimizeClicked = output();
  closeInfoClicked = output();
  maximizedClicked = output();
  tagMenuTrigger = viewChild<MatMenuTrigger>('tagsMenuTrigger');
  tagMenu = viewChild(TagsMenuComponent);

  protected isDev = computed(() => isDevelopment(this.experiment()));
  protected systemTags = computed(() => getSystemTags(this.experiment()));
  protected isPipeline = computed(() => !!this.experiment()?.system_tags?.includes(ExperimentTagsEnum.Pipeline));
  protected shared = computed(() => this.experiment()?.system_tags?.includes(ExperimentTagsEnum.Shared));
  protected selectedDisableAvailable = computed(() => ({
    [MenuItems.abort]: selectionDisabledAbort([this.experiment()]),
    [MenuItems.abortAllChildren]: selectionDisabledAbortAllChildren([this.experiment()]),
    [MenuItems.publish]: selectionDisabledPublishExperiments([this.experiment()]),
    [MenuItems.reset]: selectionDisabledReset([this.experiment()]),
    [MenuItems.delete]: selectionDisabledDelete([this.experiment()]),
    [MenuItems.moveTo]: selectionDisabledMoveTo([this.experiment()]),
    [MenuItems.enqueue]: selectionDisabledEnqueue([this.experiment()]),
    [MenuItems.retry]: selectionDisabledRetry([this.experiment()]),
    [MenuItems.dequeue]: selectionDisabledDequeue([this.experiment()]),
    [MenuItems.queue]: selectionDisabledQueue([this.experiment()]),
    [MenuItems.viewWorker]: selectionDisabledViewWorker([this.experiment()]),
    [MenuItems.archive]: selectionDisabledArchive([this.experiment()]),
    [MenuItems.run]: selectionDisabledPipelineRun([this.experiment()])
  }));

  onNameChanged(name) {
    this.experimentNameChanged.emit(name);
  }

  openTagMenu() {
    if (!this.tagMenuTrigger()) {
      return;
    }
    window.setTimeout(() => this.store.dispatch(activateEdit('tags')), 200);
    window.setTimeout(() => {
      this.tagMenuTrigger().openMenu();
      this.tagMenu().focus();
    });
  }

  addTag(tag: string) {
    this.store.dispatch(addTag({tag, experiments: [this.experiment()]}));
  }

  removeTag(tag: string) {
    this.store.dispatch(removeTag({tag, experiments: [this.experiment()]}));
  }

  tagsMenuClosed() {
    this.store.dispatch(deactivateEdit());
    this.tagMenu().clear();
  }

  editExperimentName(edit) {
    if (edit) {
      this.store.dispatch(activateEdit('ExperimentName'));
    } else {
      this.store.dispatch(deactivateEdit());
    }
  }

  editDescriptionHandler() {
    this.router.navigate(['general'], {relativeTo: this.activatedRoute}).then(() =>
      window.setTimeout(() => this.store.dispatch(activateEdit(EXPERIMENT_COMMENT)), 500));
  }

  copyToClipboard() {
    this.store.dispatch(addMessage('success', 'Copied to clipboard'));
  }
}
