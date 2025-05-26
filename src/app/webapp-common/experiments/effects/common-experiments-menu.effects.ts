import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Action, Store} from '@ngrx/store';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {Router} from '@angular/router';
import {catchError, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import {
  activeLoader,
  addMessage,
  deactivateLoader,
  neverShowPopupAgain,
  setServerError
} from '../../core/actions/layout.actions';
import * as menuActions from '../actions/common-experiments-menu.actions';
import {stopClicked} from '../actions/common-experiments-menu.actions';
import {Observable, of} from 'rxjs';
import {requestFailed} from '../../core/actions/http.actions';
import * as exSelectors from '../reducers';
import {selectExperimentsList, selectTableMode} from '../reducers';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import * as infoActions from '../actions/common-experiments-info.actions';
import {autoRefreshExperimentInfo, experimentDetailsUpdated} from '../actions/common-experiments-info.actions';
import {emptyAction} from '~/app.constants';
import * as viewActions from '../actions/common-experiments-view.actions';
import {IExperimentInfo, ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {TasksGetAllExResponse} from '~/business-logic/model/tasks/tasksGetAllExResponse';
import {ITask} from '~/business-logic/model/al-task';
import {RouterState, selectRouterConfig, selectRouterParams} from '../../core/reducers/router-reducer';
import {TasksArchiveManyResponse} from '~/business-logic/model/tasks/tasksArchiveManyResponse';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {TasksEnqueueManyResponse} from '~/business-logic/model/tasks/tasksEnqueueManyResponse';
import {getNotificationAction, MenuItems, MoreMenuItems} from '../../shared/entity-page/items.utils';
import {getAllSystemProjects} from '../../core/actions/projects.actions';
import {MatDialog} from '@angular/material/dialog';
import {ApiPipelinesService} from '~/business-logic/api-services/pipelines.service';
import {PIPELINE_INFO_ONLY_FIELDS} from '../../pipelines-controller/controllers.consts';
import {
  AbortAllChildrenDialogComponent
} from '../shared/components/abort-all-children-dialog/abort-all-children-dialog.component';
import {selectIsPipelines} from '@common/experiments-compare/reducers';
import {
  AbortControllerDialogComponent
} from '@common/pipelines-controller/pipeline-controller-menu/abort-controller-dialog/abort-controller-dialog.component';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {TasksCloneRequest} from '~/business-logic/model/tasks/tasksCloneRequest';
import {WelcomeMessageComponent, WelcomeMessageData} from '@common/layout/welcome-message/welcome-message.component';
import {selectNeverShowPopups} from '@common/core/reducers/view.reducer';
import {MESSAGES_SEVERITY} from '@common/constants';
import {TasksCloneResponse} from '~/business-logic/model/tasks/tasksCloneResponse';
import {Task} from '~/business-logic/model/tasks/task';
import {TasksUpdateTagsResponse} from '~/business-logic/model/tasks/tasksUpdateTagsResponse';
import * as commonInfoActions from '@common/experiments/actions/common-experiments-info.actions';
import {addProjectsTag} from '../actions/common-experiments-view.actions';
import {ITableExperiment} from '@common/experiments/shared/common-experiment-model.model';
import * as projectsActions from '@common/core/actions/projects.actions';
import {PipelinesStartPipelineResponse} from '~/business-logic/model/pipelines/pipelinesStartPipelineResponse';
import {selectSelectedProjectId} from '@common/core/reducers/projects.reducer';
import {TasksGetByIdExResponse} from '~/business-logic/model/tasks/tasksGetByIdExResponse';

export const getChildrenExperiments = (tasksApi, parents, filters?: Record<string, any>): Observable<Task[]> =>
  tasksApi.tasksGetAllEx({

    page_size: 2000,
    only_fields: ['name', 'status'],
    status: [TaskStatusEnum.Queued, TaskStatusEnum.InProgress],
    parent: parents.map(p => p.id), ...(filters && filters)

  })
    .pipe(
      map((res: TasksGetAllExResponse) => res.tasks),
      catchError(() => of([]))
    );

@Injectable()
export class CommonExperimentsMenuEffects {

  constructor(private actions$: Actions,
              private store: Store,
              private apiTasks: ApiTasksService,
              private pipelineApi: ApiPipelinesService,
              private router: Router,
              private dialog: MatDialog
  ) {}

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(
      menuActions.restoreSelectedExperiments,
      menuActions.archiveSelectedExperiments,
      menuActions.publishClicked,
      menuActions.stopClicked,
      menuActions.changeProjectRequested,
      menuActions.startPipeline,
      menuActions.getControllerForStartPipelineDialog,
      menuActions.abortAllChildren
    ),
    map(action => activeLoader(action.type))));

  enqueueExperiment$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.enqueueClicked),
    concatLatestFrom(() => this.store.select(selectSelectedExperiment)),
    switchMap(([action, selectedEntity]) => {
        const ids = action.selectedEntities.map(exp => exp.id);
        return this.apiTasks.tasksEnqueueMany({

          ids,
          queue: action.queue.id, ...((!action.queue.id) && {queue_name: action.queue.name}),
          validate_tasks: true,
          ...( action.verifyWatchers && {verify_watched_queue: true})

        })
          .pipe(
            mergeMap((res: TasksEnqueueManyResponse) => [
              ...this.updateExperimentsSuccess(action, MenuItems.enqueue, ids, selectedEntity, res),
              ...(res.queue_watched === false ? [menuActions.openEmptyQueueMessage({queue: action.queue})] : [])
            ]),
            catchError(error => this.updateExperimentFailed(action.type, error))
          );
      }
    )
  ));

  openMessage = createEffect(() => this.actions$.pipe(
    ofType(menuActions.openEmptyQueueMessage),
    concatLatestFrom(() => this.store.select(selectNeverShowPopups)),
    switchMap(([action, neverShowAgainPopups]) => !neverShowAgainPopups.includes('orphanedQueue') ?
        this.dialog.open<WelcomeMessageComponent, WelcomeMessageData, boolean>(WelcomeMessageComponent, {
          data: {
            queue: action.queue,
            entityName: action.entityName,
            step: 2
          }
        }).afterClosed() : of(null)
    ),
    map(doNotShowAgain => doNotShowAgain ? neverShowPopupAgain({popupId: 'orphanedQueue'}) : emptyAction())
  ));

  startPipeline$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.startPipeline),
    concatLatestFrom(() => this.store.select(selectSelectedProjectId)),
    switchMap(([action, projectId]) =>
      this.pipelineApi.pipelinesStartPipeline({
        task: action.task,
        ...(action.queue && {queue: action.queue.id}),
        args: action.args,
        verify_watched_queue: true
      })
        .pipe(
          mergeMap((res: PipelinesStartPipelineResponse) => [
            viewActions.getExperiments(),
            viewActions.setSelectedExperiments({experiments: []}),
            viewActions.experimentSelectionChanged({
              experiment: {id: res.pipeline},
              project: projectId
            }),
            deactivateLoader(action.type),
            ...(res.queue_watched === false ? [menuActions.openEmptyQueueMessage({queue: action.queue, entityName: 'Pipeline'})] : [])
          ]),
          catchError(error => [
            deactivateLoader(action.type),
            setServerError(error, null, 'Run Pipeline failed'),
            requestFailed(error)
          ])
        )
    )
  ));

  getPipelineControllerForRunDialog$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.getControllerForStartPipelineDialog),
    concatLatestFrom(() => this.store.select(selectRouterParams).pipe(map(params => params?.projectId))),
    switchMap(([action, projectId]) =>
      this.apiTasks.tasksGetAllEx({

        project: projectId,
        type: [TaskTypeEnum.Controller],
        ...(action.task && {id: [action.task]}),
        ...(!action.task && {order_by: ['-started'], page_size: 1}),
        only_fields: PIPELINE_INFO_ONLY_FIELDS

      }).pipe(
        mergeMap((res: TasksGetAllExResponse) => [
          menuActions.setControllerForStartPipelineDialog({task: res?.tasks[0] as unknown as IExperimentInfo}),
          deactivateLoader(action.type)
        ]),
        catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
          ]
        )
      )
    )
  ));


  dequeueExperiment$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.dequeueClicked),
    concatLatestFrom(() => this.store.select(selectSelectedExperiment)),
    switchMap(([action, selectedEntity]) => {
        const ids = action.selectedEntities.map(exp => exp.id);
        return this.apiTasks.tasksDequeueMany({ids})
          .pipe(
            mergeMap(res => this.updateExperimentsSuccess(action, MenuItems.dequeue, ids, selectedEntity, res)),
            catchError(error => this.updateExperimentFailed(action.type, error))
          );
      }
    )
  ));


  cloneExperimentRequested$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.cloneExperimentClicked),
    concatLatestFrom(() => this.store.select(selectTableMode)),
    switchMap(([action, ]) => this.apiTasks.tasksClone({
        task: action.originExperiment.id,

        ...(action.cloneData?.project?.value && {new_task_project: action.cloneData.project.value}),
        new_task_comment: action.cloneData.comment,
        new_task_name: action.cloneData.name,
        new_project_name: action.cloneData.newProjectName,
        ...(action.cloneData.forceParent && {new_task_parent: action.originExperiment.id})

      } as TasksCloneRequest)
        .pipe(
          mergeMap((res: TasksCloneResponse) => {
            this.router.navigate(['projects', action.cloneData.project?.value || res.new_project?.id || '*', 'tasks', res.id]);
            return [
              viewActions.getExperiments(),
              deactivateLoader(action.type),
              ...action.cloneData.newProjectName ? [
                projectsActions.setDeep({deep: false}),
                getAllSystemProjects()] : [],
            ];
          }),
          catchError(error => [
            deactivateLoader(action.type),
            setServerError(error, null, 'Clone Task failed'),
            requestFailed(error)
          ])
        )
    )
  ));

  publishExperiment$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.publishClicked),
    concatLatestFrom(() => this.store.select(selectSelectedExperiment)),
    switchMap(([action, selectedEntity]) => {
      const ids = action.selectedEntities.map(exp => exp.id);
      return this.apiTasks.tasksPublishMany({ids})
        .pipe(
          mergeMap(res => this.updateExperimentsSuccess(action, MenuItems.publish, ids, selectedEntity, res)),
          catchError(error => this.updateExperimentFailed(action.type, error))
        );
    })
  ));

  abortAllChildren = createEffect(() => this.actions$.pipe(
    ofType(menuActions.abortAllChildren),
    concatLatestFrom(() => this.store.select(selectIsPipelines)),
    switchMap(([action, isPipeline]) => getChildrenExperiments(this.apiTasks, action.experiments)
      .pipe(
        tap(() => this.store.dispatch(deactivateLoader(action.type))),
        mergeMap(shouldBeAbortedTasks => (isPipeline ?
          this.dialog.open(AbortControllerDialogComponent, {data: {tasks: action.experiments, shouldBeAbortedTasks}}) :
          this.dialog.open(AbortAllChildrenDialogComponent, {data: {tasks: action.experiments, shouldBeAbortedTasks}})
        ).afterClosed()),
        mergeMap(confirmed => [
          confirmed ? stopClicked({selectedEntities: action.experiments, includePipelineSteps: isPipeline }) : emptyAction(),
          deactivateLoader(action.type)
        ]),
        catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, 'Failed to fetch tasks running children')])
      )),
  ));


  stopExperiment$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.stopClicked),
    concatLatestFrom(() => this.store.select(selectSelectedExperiment)),
    switchMap(([action, selectedEntity]) => {
        const ids = action.selectedEntities.map(exp => exp.id);
        return this.apiTasks.tasksStopMany({ids, include_pipeline_steps: action.includePipelineSteps})
          .pipe(
            mergeMap(res => this.updateExperimentsSuccess(action, MenuItems.abort, ids, selectedEntity, res)),
            catchError(error => this.updateExperimentFailed(action.type, error))
          );
      }
    )
  ));


  changeProject$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.changeProjectRequested),
    switchMap(
      action => this.apiTasks.tasksMove({
        ids: action.selectedEntities.map(exp => exp.id),
        project: action.project.id,

        project_name: action.project.name
      })
        .pipe(
          tap((res) => this.router.navigate(['projects', action.project.id ? action.project.id : res.project_id ?? '*', 'tasks', action.selectedEntities.length === 1 ? action.selectedEntities[0].id : ''], {queryParamsHandling: 'merge'})),
          concatLatestFrom(() => this.store.select(selectSelectedExperiment)),
          mergeMap(([, selectedExperiment]) => [
            viewActions.resetExperiments({}),
            viewActions.setSelectedExperiments({experiments: []}),
            ...action.selectedEntities.map(exp => this.setExperimentIfSelected(selectedExperiment, exp.id, {project: action.project ?? '*'})),
            deactivateLoader(action.type),
            viewActions.getExperiments(),
            addMessage(MESSAGES_SEVERITY.SUCCESS, `Task moved successfully to ${action.project.name ?? 'Projects root'}`)
          ]),
          catchError(error => [requestFailed(error), deactivateLoader(action.type), setServerError(error, null, 'Failed to move tasks')])
        )
    )
  ));

  private updateExperimentsSuccess(action, operationName: MenuItems, ids: string[], selectedEntity, res: TasksEnqueueManyResponse): Action[] {
    const actions = [
      // new RefreshExperiments({autoRefresh: false, hideLoader: true}),
      viewActions.updateManyExperiment({changeList: res.succeeded}),
      deactivateLoader(action.type)] as Action[];
    if (ids.includes(selectedEntity?.id)) {
      actions.push(autoRefreshExperimentInfo({id: selectedEntity.id}));
    }
    actions.push(getNotificationAction(res, action, operationName, EntityTypeEnum.experiment));
    return actions;
  }

  updateExperimentFailed(actionType, error) {
    return [
      requestFailed(error),
      deactivateLoader(actionType),
      setServerError(error)
    ];
  }

  setExperimentIfSelected(selectedExperiment, experimentId, payload) {
    if (selectedExperiment?.id === experimentId) {
      return infoActions.setExperiment({experiment: {...selectedExperiment, ...payload}});
    }
    return emptyAction();
  }

  addTag$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.addTag),
    switchMap(action => {
      const ids = action.experiments.map(e => e.id);
      return this.apiTasks.tasksUpdateTags({
        ids,
        add_tags: [action.tag]
      })
        .pipe(
          concatLatestFrom(() => [
            this.store.select(selectExperimentsList),
            this.store.select(selectSelectedExperiment)
          ]),
          mergeMap(([res, experiments, selectedExperimentInfo]: [TasksUpdateTagsResponse, ITableExperiment[], IExperimentInfo]) => {
            if (res.updated === ids.length) {
              const updatedExperiments = experiments?.filter(exp => ids.includes(exp.id)) ?? action.experiments;
              return [
                viewActions.updateManyExperiment({changeList: updatedExperiments.map(exp => ({
                    id: exp.id,
                    fields: {tags: Array.from(new Set((exp?.tags || []).concat([action.tag]))).sort()},
                  }))}),
                ...(ids.includes(selectedExperimentInfo?.id) ?
                  [commonInfoActions.updateExperimentInfoData({
                    id: selectedExperimentInfo.id,
                    changes: {tags: Array.from(new Set((selectedExperimentInfo?.tags || []).concat([action.tag]))).sort()}
                  })] :
                  []),
                addProjectsTag({tag: action.tag}),
                projectsActions.addCompanyTag({tag: action.tag}),
              ];
            } else {
              return [addMessage(MESSAGES_SEVERITY.ERROR, 'Not all tags were applied')]
            }
          }),
          catchError(() => [addMessage(MESSAGES_SEVERITY.ERROR, 'Failed to apply tags')])
        );
    }),
  ));


  removeTag$ = createEffect(() => this.actions$.pipe(
    ofType(menuActions.removeTag),
    switchMap((action) => [
      ...action.experiments
        .filter(experiment => experiment.tags.includes(action.tag))
        .map(experiment =>
          experimentDetailsUpdated({
            id: experiment.id,
            changes: {tags: experiment.tags.filter(tag => tag !== action.tag)}
          })
        ),
      addMessage('success', `“${action.tag}” tag has been removed from “${action.experiments[0]?.name}” task`, [
        {
          name: 'Undo',
          actions: [
            addMessage('success', `“${action.tag}” tag has been restored`),
            ...action.experiments.map(() => menuActions.addTag({
              experiments: action.experiments,
              tag: action.tag
            }))
          ]
        }]
      )
    ])
  ));


  archiveExperiments = createEffect(() => this.actions$.pipe(
    ofType(menuActions.archiveSelectedExperiments),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams),
      this.store.select(exSelectors.selectSelectedTableExperiment),
      this.store.select(selectTableMode),
      this.store.select(selectIsPipelines),
    ]),
    switchMap(([action, routerParams, selectedExperiment, tableMode, isPipelines]) =>
      this.apiTasks.tasksArchiveMany({ids: action.selectedEntities.map(exp => exp.id), include_pipeline_steps: isPipelines})
      .pipe(
        concatLatestFrom(() => this.store.select(selectRouterConfig)),
        mergeMap(([res, routerConfig]: [TasksArchiveManyResponse, RouterState['config']]) => {
          const experiments = action.selectedEntities;
          const allFailed = res.failed.length === experiments.length;
          const undoAction = [
            {
              name: 'Undo', actions: [
                viewActions.setSelectedExperiments({experiments}),
                menuActions.restoreSelectedExperiments({
                  selectedEntities: experiments,
                  skipUndo: true,
                  entityType: action.entityType
                })
              ]
            }
          ];
          let actions: Action[] = [
            deactivateLoader(action.type),
            viewActions.setSelectedExperiments({experiments: []}),
            getNotificationAction(res, action, MenuItems.archive, action.entityType || EntityTypeEnum.experiment, (action.skipUndo || allFailed) ? [] : undoAction)
          ];
          if (routerConfig.includes('tasks')) {
            const failedIds = res.failed.map(fail => fail.id);
            const successExperiments = experiments.map(exp => exp.id).filter(id => !failedIds.includes(id));
            actions = actions.concat([
              viewActions.removeExperiments({experiments: successExperiments}),
              viewActions.getExperiments()
            ]);
          }
          if (routerConfig.includes('output') && routerParams?.experimentId === experiments[0].id) {
            actions.push(experimentDetailsUpdated({
              id: experiments[0].id,

              changes: {system_tags: [...(experiments[0]?.system_tags.filter(t => t !== 'shared') ?? []), 'archived'].sort()}
            }));
          }
          if (this.isSelectedExpInCheckedExps(action.selectedEntities, selectedExperiment) || tableMode === 'compare') {
            actions.push(viewActions.selectNextExperiment());
          }
          return actions;
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          setServerError(error, null, `Failed To Archive ${action.entityType || 'Task'}s`)
        ])
      )
    )
  ));


  restoreExperiments = createEffect(() => this.actions$.pipe(
    ofType(menuActions.restoreSelectedExperiments),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams),
      this.store.select(exSelectors.selectSelectedTableExperiment),
      this.store.select(selectTableMode),

    ]),
    switchMap(([action, routerParams, selectedExperiment, tableMode]) => this.apiTasks.tasksUnarchiveMany({ids: action.selectedEntities.map(exp => exp.id)})
      .pipe(
        concatLatestFrom(() => this.store.select(selectRouterConfig)),
        mergeMap(([res, routerConfig]: [TasksArchiveManyResponse, RouterState['config']]) => {
          const experiments = action.selectedEntities;
          const allFailed = res.failed.length === experiments.length;
          const undoAction = [
            {
              name: 'Undo', actions: [
                viewActions.setSelectedExperiments({experiments}),
                menuActions.archiveSelectedExperiments({
                  selectedEntities: experiments,
                  skipUndo: true,
                  entityType: action.entityType
                })
              ]
            }
          ];
          let actions: Action[] = [
            deactivateLoader(action.type),
            viewActions.setSelectedExperiments({experiments: []}),
            getNotificationAction(res, action, MoreMenuItems.restore, action.entityType || EntityTypeEnum.experiment, (action.skipUndo || allFailed) ? [] : undoAction)
          ];
          if (routerConfig.includes('tasks')) {
            const failedIds = res.failed.map(fail => fail.id);
            const successExperiments = experiments.map(exp => exp.id).filter(id => !failedIds.includes(id));
            actions = actions.concat([
              viewActions.removeExperiments({experiments: successExperiments}),
              viewActions.getExperiments(),
            ]);
          }
          if (routerConfig.includes('output') && routerParams?.experimentId === experiments[0].id) {
            actions.push(experimentDetailsUpdated({
              id: experiments[0].id,

              changes: {system_tags: experiments[0]?.system_tags.filter(tag => tag !== 'archived')}
            }));
          }
          if (this.isSelectedExpInCheckedExps(action.selectedEntities, selectedExperiment) || tableMode === 'compare') {
            actions.push(viewActions.selectNextExperiment());
          }
          return actions;
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          setServerError(error, null, `Failed To Restore ${action.entityType || 'Task'}s`)
        ])
      )
    )
  ));


  navigateToQueue = createEffect(() => this.actions$.pipe(
    ofType(menuActions.navigateToQueue),
    concatLatestFrom(() => this.store.select(selectSelectedExperiment)),
    switchMap(([action, info]) => {
      if (action.experimentId === info?.id && info?.execution?.queue?.id) {
        return of({tasks: [info]});
      } else {
        return this.apiTasks.tasksGetAllEx({
          id: [action.experimentId],

          only_fields: ['execution.queue.id']
        });
      }
    }),
    map((res: TasksGetAllExResponse) => {
      const queue = (res.tasks[0] as unknown as ITask).execution.queue;
      return this.router.navigate(['workers-and-queues', 'queues'], {queryParams: {id: queue.id}});
    })
  ), {dispatch: false});

  navigateToWorker = createEffect(() => {
    return this.actions$.pipe(
      ofType(menuActions.navigateToWorker),
      concatLatestFrom(() => this.store.select(selectSelectedExperiment)),
      switchMap(([action, info]) => {
        if (action.experimentId === info?.id && info?.last_worker) {
          return of({tasks: [info]});
        } else {
          return this.apiTasks.tasksGetByIdEx({
            id: [action.experimentId],
            only_fields: ['last_worker']
          });
        }
      }),
      map((res: TasksGetByIdExResponse) => {
        const worker = (res.tasks[0]).last_worker;
        // return this.router.navigate(['/workers-and-queues/queues'], {queryParams: {id: queue.id}});

        this.router.navigate(['workers-and-queues', 'workers'], {queryParams: {id: worker}});
      })
    )
  }, {dispatch: false});


  isSelectedExpInCheckedExps(checked: ISelectedExperiment[], selected: IExperimentInfo): boolean {
    return selected && checked.some(exp => exp.id === selected.id);
  }

}
