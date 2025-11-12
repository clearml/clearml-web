import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {filter, take} from 'rxjs/operators';
import {ICONS} from '@common/constants';
import {Queue} from '~/business-logic/model/queues/queue';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {BlTasksService} from '~/business-logic/services/tasks.service';
import {CloneExperimentPayload} from '../../common-experiment-model.model';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import * as commonMenuActions from '../../../actions/common-experiments-menu.actions';
import {abortAllChildren, archiveSelectedExperiments} from '../../../actions/common-experiments-menu.actions';
import {MoveProjectData, MoveProjectDialogComponent} from '@common/experiments/shared/components/move-project-dialog/move-project-dialog.component';
import {CloneDialogComponent, CloneDialogData} from '../clone-dialog/clone-dialog.component';
import {SelectQueueComponent} from '../select-queue/select-queue.component';
import {IExperimentInfo, ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {getQueuesForEnqueue} from '../select-queue/select-queue.actions';
import {selectQueuesList} from '../select-queue/select-queue.reducer';
import {isDevelopment} from '~/features/experiments/shared/experiments.utils';
import {Component, computed, inject, input, output, TemplateRef, viewChild} from '@angular/core';
import {BaseContextMenuComponent} from '@common/shared/components/base-context-menu/base-context-menu.component';
import * as experimentsActions from '../../../actions/common-experiments-view.actions';
import {ShareDialogComponent} from '@common/shared/ui-components/overlay/share-dialog/share-dialog.component';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {selectNeverShowPopups} from '@common/core/reducers/view.reducer';
import {
  CommonDeleteDialogComponent,
  DeleteData
} from '@common/shared/entity-page/entity-delete/common-delete-dialog.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {
  autoRefreshExperimentInfo,
  deactivateEdit,
  setExperiment
} from '../../../actions/common-experiments-info.actions';
import {neverShowPopupAgain} from '@common/core/actions/layout.actions';
import {
  selectionDisabledAbort,
  selectionDisabledAbortAllChildren,
  selectionDisabledArchive, selectionDisabledDelete,
  selectionDisabledDequeue,
  selectionDisabledEnqueue,
  selectionDisabledMoveTo,
  selectionDisabledPublishExperiments,
  selectionDisabledReset,
  selectionDisabledRetry
} from '@common/shared/entity-page/items.utils';
import {resetOutput} from '@common/experiments/actions/common-experiment-output.actions';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {resetDebugImages} from '@common/debug-images/debug-images-actions';
import {
  IOption
} from '@common/shared/ui-components/inputs/select-autocomplete-with-chips/select-autocomplete-with-chips.component';
import {headerActions} from '@common/core/actions/router.actions';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {Task} from '~/business-logic/model/tasks/task';
import {Project} from '~/business-logic/model/projects/project';


@Component({
    selector: 'sm-experiment-menu',
    templateUrl: './experiment-menu.component.html',
    styleUrls: ['./experiment-menu.component.scss'],
    standalone: false
})
export class ExperimentMenuComponent extends BaseContextMenuComponent {
  protected blTaskService = inject(BlTasksService);
  protected dialog = inject(MatDialog);
  protected router = inject(Router);
  protected configService = inject(ConfigurationService);
  protected route = inject(ActivatedRoute);
  protected readonly icons = ICONS;
  protected readonly taskStatusEnum = TaskStatusEnum;
  protected readonly taskTypeEnum = TaskTypeEnum;

  public open: boolean;

  selectedExperiment = input<IExperimentInfo>();
  isSharedNotInWorkspaces = input(false);
  tagsFilterByProject = input<boolean>();
  projectTags = input<string[]>();
  companyTags = input<string[]>();
  numSelected = input(0);
  activateFromMenuButton = input(true);
  useCurrentEntity = input(false);
  isCompare = input(false);


  neverShowPopups = input();
  minimizedView = input<boolean>();


  experiment = input.required<ISelectedExperiment>();
  selectedExperiments = input<IExperimentInfo[]>();

  protected isExample = computed(() => isReadOnly(this.experiment()));
  protected isArchive = computed(() => this.experiment()?.system_tags?.includes('archived'));
  protected selectionHasExamples = computed(() => this.selectedExperiments()?.some((exp => isReadOnly(exp))));
  protected isCommunity = computed(() => this.configService.configuration().communityServer);

  tagSelected = output<string>();
  stopTemplate = viewChild.required<TemplateRef<{$implicit: ISelectedExperiment[]}>>('stopTemplate ');
  dequeueTemplate = viewChild.required<TemplateRef<{$implicit: ISelectedExperiment[]; queueName: string}>>('dequeueTemplate');
  publishTemplate = viewChild.required<TemplateRef<{$implicit: ISelectedExperiment[]}>>('publishTemplate ');

  public restoreArchive(entityType?: EntityTypeEnum) {
    // info header case
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledArchive(this.selectedExperiments()).selectedFiltered : [this.experiment()];

    if (selectedExperiments[0].system_tags?.includes('archived')) {
      this.store.dispatch(commonMenuActions.restoreSelectedExperiments({
        selectedEntities: selectedExperiments,
        entityType
      }));
    } else {
      this.store.select(selectNeverShowPopups)
        .pipe(take(1))
        .subscribe(neverShow => {
          const showShareWarningDialog = selectedExperiments.find(item => item?.system_tags.includes('shared')) &&
            !neverShow?.includes('archive-shared-task');
          const showRunningWarningDialog = selectedExperiments.some(experiment =>
            [TaskStatusEnum.Queued, TaskStatusEnum.InProgress].includes(experiment.status)
          );
          if (showShareWarningDialog) {
            this.showConfirmArchiveExperiments(selectedExperiments, entityType);
          }
          else if (showRunningWarningDialog) {
            this.showConfirmArchiveExperiments(selectedExperiments, entityType, 'ARCHIVE A RUNNING TASK',
              'Some of the tasks you are about to archive are running or queued.<br>Archiving running tasks will also <b>RESET</b> them.<br>Archive tasks?',
              false);
          } else {
            this.store.dispatch(commonMenuActions.archiveSelectedExperiments({
              selectedEntities: selectedExperiments,
              entityType
            }));
          }
        });
    }
  }

  toggleFullScreen(showFullScreen: boolean) {
    if (showFullScreen) {
      this.store.dispatch(headerActions.reset());
      this.router.navigateByUrl(`projects/${this.projectId()}/tasks/${this.experiment().id}/output`);
    } else {
      const part = this.route.firstChild.routeConfig.path;
      this.router.navigateByUrl(`projects/${this.projectId()}/tasks/${this.experiment().id}/${part}`);
    }
  }

  enqueuePopup() {
    const selectedExperiments = !(this.activateFromMenuButton() || this.useCurrentEntity()) ?
      selectionDisabledEnqueue(this.selectedExperiments()).selectedFiltered :
      [this.experiment()];
    this.openEnqueuePopup(selectedExperiments);
  }

  retryPopup() {
    const selectedExperiments = !(this.activateFromMenuButton() || this.useCurrentEntity()) ?
      selectionDisabledRetry(this.selectedExperiments()).selectedFiltered :
      [this.experiment()];
    this.openEnqueuePopup(selectedExperiments, true);
  }

  private openEnqueuePopup(selectedExperiments: ISelectedExperiment[], retryMode?: boolean) {
    const selectQueueDialog: MatDialogRef<SelectQueueComponent, { confirmed: boolean; queue: Queue }> =
      this.dialog.open(SelectQueueComponent, {
        autoFocus: 'dialog',
        data: {
          taskIds: selectedExperiments.map(exp => exp.id),
          reference: selectedExperiments[0].name,
          retryMode
        }
      });

    selectQueueDialog.afterClosed().subscribe(res => {
      if (res && res.confirmed) {
        this.enqueueExperiment(res.queue, selectedExperiments);
        this.blTaskService.setPreviouslyUsedQueue(res.queue);
      }
    });
  }

  dequeuePopup() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledDequeue(this.selectedExperiments()).selectedFiltered : [this.experiment()];
    this.store.dispatch(getQueuesForEnqueue());
    const confirmDialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig<{$implicit: ISelectedExperiment[]; queueName?: string}>, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Dequeue Task',
        template: this.dequeueTemplate(),
        templateContext: {$implicit: selectedExperiments},
        yes: 'Dequeue',
        no: 'Cancel',
        iconClass: 'al-ico-alert',
        iconColor: 'var(--color-warning)'
      }
    });

    confirmDialogRef.afterClosed()
      .pipe(filter(response => response))
      .subscribe(() => this.dequeueExperiment(selectedExperiments));

    this.store.select(selectQueuesList)
      .pipe(filter(qs => !!qs), take(2))
      .subscribe(queues => {
        const queue = queues.find(q => q.entries.some(entry => (entry.task as Task).id === this.experiment().id));
        if (confirmDialogRef.componentInstance && queue) {
          confirmDialogRef.componentInstance.templateContext = {$implicit: selectedExperiments, queueName: queue.caption};
        }
      });
  }

  private enqueueExperiment(queue, selectedExperiments) {
    this.store.dispatch(commonMenuActions.enqueueClicked({
      selectedEntities: selectedExperiments,
      queue,
      verifyWatchers: true
    }));
  }

  private dequeueExperiment(selectedExperiments) {
    this.store.dispatch(commonMenuActions.dequeueClicked({selectedEntities: selectedExperiments}));
  }

  public enqueueDequeueDisabled() {
    return !(this.blTaskService.canEnqueue(this.experiment()) || this.blTaskService.canDequeue(this.experiment()));
  }

  public resetPopup() {
    const selectedExperiments = (!(this.activateFromMenuButton() || this.useCurrentEntity()) && this.selectedExperiments()) ? selectionDisabledReset(this.selectedExperiments()).selectedFiltered : [this.experiment()];
    const devWarning: boolean = selectedExperiments.some(exp => isDevelopment(exp));
    const confirmDialogRef = this.dialog.open<CommonDeleteDialogComponent, DeleteData, boolean>(CommonDeleteDialogComponent, {
      data: {
        entity: selectedExperiments?.length > 0 ? selectedExperiments?.length === 1 ? selectedExperiments[0] : selectedExperiments : this.experiment(),
        numSelected: selectedExperiments?.length ?? this.numSelected(),
        entityType: EntityTypeEnum.experiment,
        useCurrentEntity: this.activateFromMenuButton() || this.useCurrentEntity(),
        resetMode: true,
        devWarning
      },
      disableClose: true
    });
    confirmDialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(resetOutput());
        if (this.activateFromMenuButton() || !this.tableMode() && this.selectedExperiments().some(exp => exp.id === this.experiment().id)) {
          this.store.dispatch(resetDebugImages());
          this.store.dispatch(autoRefreshExperimentInfo({id: this.experiment().id}));
        }
        this.store.dispatch(deactivateEdit());
      }
    });
  }

  public stopPopup() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledAbort(this.selectedExperiments()).selectedFiltered : [this.experiment()];

    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig<{$implicit: ISelectedExperiment[]}>, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'ABORT',
        template: this.stopTemplate(),
        templateContext: {$implicit: selectedExperiments},
        yes: 'Abort',
        no: 'Cancel',
        iconClass: 'al-ico-abort',
      }
    }).afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.dispatch(commonMenuActions.stopClicked({selectedEntities: selectedExperiments}));
        }
      });
  }

  public publishPopup() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledPublishExperiments(this.selectedExperiments()).selectedFiltered : [this.experiment()];

    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig<{$implicit: ISelectedExperiment[]}>, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'PUBLISH TASKS',
        template: this.publishTemplate(),
        templateContext: {$implicit: selectedExperiments},
        yes: 'Publish',
        no: 'Cancel',
        iconClass: 'al-ico-publish',
      }
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.publishExperiment(selectedExperiments);
      }
    });
  }

  publishExperiment(selectedExperiments) {
    this.store.dispatch(commonMenuActions.publishClicked({selectedEntities: selectedExperiments}));
  }

  shareExperimentPopup() {
    this.dialog.open(ShareDialogComponent, {
      data: {
        title: 'SHARE TASK PUBLICLY',
        link: `${window.location.origin}/projects/${this.experiment().project.id}/experiments/${this.experiment().id}/output/execution`,
        alreadyShared: this.experiment()?.system_tags.includes('shared'),
        task: this.experiment()?.id
      }
    });
  }

  public moveToProjectPopup() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledMoveTo(this.selectedExperiments()).selectedFiltered : [this.experiment()];
    const currentProjects = Array.from(new Set(selectedExperiments.map(exp => exp.project?.id).filter(p => p)));
    const dialog = this.dialog.open<MoveProjectDialogComponent, MoveProjectData, Project>(MoveProjectDialogComponent, {
      data: {
        currentProjects: currentProjects.length > 0 ? currentProjects : [this.projectId()],
        defaultProject: this.experiment()?.project,
        reference: selectedExperiments.length > 1 ? selectedExperiments : selectedExperiments[0]?.name,
        type: EntityTypeEnum.experiment
      }
    });
    dialog.afterClosed()
      .pipe(
        take(1),
        filter(project => !!project)
      )
      .subscribe(project => this.store.dispatch(commonMenuActions.changeProjectRequested({
          selectedEntities: selectedExperiments,
          project
        })));
  }

  viewWorkerClicked() {
    this.store.dispatch(commonMenuActions.navigateToWorker({experimentId: this.experiment()?.id}));
  }

  manageQueueClicked() {
    this.store.dispatch(commonMenuActions.navigateToQueue({experimentId: this.experiment()?.id}));
  }

  clonePopup() {
    this.dialog.open<CloneDialogComponent, CloneDialogData, CloneExperimentPayload>(CloneDialogComponent, {
      data: {
        type: 'Task',
        defaultProject: this.isExample() ? '' : this.experiment()?.project?.id,
        defaultName: this.experiment().name
      }
    }).afterClosed().pipe(
      take(1),
      filter(res => !!res),
    ).subscribe(res => {
      this.cloneExperiment(res);
    });
  }

  cloneExperiment(cloneData: CloneExperimentPayload) {
    const project = cloneData.project as IOption;
    this.store.dispatch(commonMenuActions.cloneExperiment({
      originExperiment: this.experiment(),
      cloneData: {
        ...cloneData,
        project: project,
        ...(!project?.value && {newProjectName: project.label})
      }
    }));
  }

  deleteExperimentPopup(entityType?: EntityTypeEnum, includeChildren?: boolean) {
    const selectedExperiments = (!(this.activateFromMenuButton() || this.useCurrentEntity()) && this.selectedExperiments()) ? selectionDisabledDelete(this.selectedExperiments()).selectedFiltered : [this.experiment()];
    const confirmDialogRef =     this.dialog.open<CommonDeleteDialogComponent, DeleteData, boolean>(CommonDeleteDialogComponent, {
      data: {
        entity: selectedExperiments?.length > 0 ? selectedExperiments?.length === 1 ? selectedExperiments[0] : selectedExperiments : this.experiment(),
        numSelected: selectedExperiments?.length ?? this.numSelected(),
        entityType: entityType || EntityTypeEnum.experiment,
        useCurrentEntity: this.activateFromMenuButton() || this.useCurrentEntity(),
        includeChildren
      },

      disableClose: true
    });
    confirmDialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(experimentsActions.setSelectedExperiments({experiments: []}));
        this.store.dispatch(setExperiment({experiment: null}));
        this.store.dispatch(experimentsActions.getExperiments());
        this.store.dispatch(deactivateEdit());

        if (this.activateFromMenuButton() || this.selectedExperiments().map(e => e.id).includes(this.selectedExperiment()?.id)) {
          const entityBaseRoute = {
            [EntityTypeEnum.experiment]: 'projects',
            [EntityTypeEnum.dataset]: 'datasets/simple',
            [EntityTypeEnum.controller]: 'pipelines'
          };
          window.setTimeout(() => this.router.navigate([entityBaseRoute[entityType] || 'projects', this.projectId(), 'tasks'], {queryParamsHandling: 'preserve'}));
        }
        if (this.isCompare()) {
          window.setTimeout(() => this.router.navigate([{ids: []}], {queryParamsHandling: 'preserve', relativeTo: this.route.firstChild}));
        }
      }
    });
  }

  showConfirmArchiveExperiments(selectedExperiments: ISelectedExperiment[], entityType: EntityTypeEnum, title?: string, body?: string, showNeverShowAgain = true): void {
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, {isConfirmed: boolean, neverShowAgain: boolean}>(ConfirmDialogComponent, {
      data: {
        title: title ?? 'ARCHIVE A PUBLICLY SHARED TASK',
        body: body ?? `This task is accessible through a public access link.
            Archiving will disable public access`,
        yes: 'OK',
        no: 'Cancel',
        iconClass: 'al-ico-archive',
        showNeverShowAgain
      }
    }).afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.dispatch(archiveSelectedExperiments({selectedEntities: selectedExperiments, entityType}));
          if (confirmed.neverShowAgain) {
            this.store.dispatch(neverShowPopupAgain({popupId: title ?? 'archive-shared-task'}));
          }
        }
      });
  }

  stopAllChildrenPopup() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledAbortAllChildren(this.selectedExperiments()).selectedFiltered : [this.experiment()];
    this.store.dispatch(abortAllChildren({experiments: selectedExperiments}));
  }

  toggleDetails() {
    this.store.dispatch(experimentsActions.setTableMode({mode: 'info'}));
    this.store.dispatch(experimentsActions.experimentSelectionChanged({
      experiment: this.experiment(),
      project: this.projectId()
    }));
  }
}
