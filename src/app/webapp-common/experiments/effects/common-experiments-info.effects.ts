import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Store} from '@ngrx/store';
import {catchError, filter, map, mergeMap, shareReplay, switchMap, take, tap} from 'rxjs/operators';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {getExperimentInfoOnlyFields} from '~/features/experiments/experiments.consts';
import {
  experimentInfo,
  selectExperimentFormValidity,
  selectExperimentInfoData,
  selectExperimentInfoDataFreeze,
  selectSelectedExperiment
} from '~/features/experiments/reducers';
import {ExperimentReverterService} from '~/features/experiments/shared/services/experiment-reverter.service';
import {requestFailed} from '../../core/actions/http.actions';
import {
  activeLoader,
  addMessage,
  deactivateLoader,
  setBackdrop,
  setServerError
} from '../../core/actions/layout.actions';
import {selectAppVisible} from '../../core/reducers/view.reducer';
import * as commonInfoActions from '../actions/common-experiments-info.actions';
import {
  cancelExperimentEdit,
  deactivateEdit,
  deleteHyperParamsSection,
  experimentDetailsUpdated,
  getExperimentConfigurationNames,
  getExperimentConfigurationObj,
  getPipelineConfigurationObj,
  getSelectedPipelineStep,
  navigateToDataset,
  saveExperiment,
  saveExperimentConfigObj,
  saveExperimentSection,
  saveHyperParamsSection,
  setExperimentSaving, setLastTasksTab,
  TreeStep
} from '../actions/common-experiments-info.actions';
import {getTags, updateExperiment} from '../actions/common-experiments-view.actions';
import {
  selectExperimentConfiguration,
  selectExperimentHyperParamsSelectedSectionFromRoute,
  selectExperimentSelectedConfigObjectFromRoute,
  selectPipelineSelectedStep,
  selectSelectedExperimentFromRouter,
  selectSelectedFromTable,
  selectSelectedTableExperiment
} from '../reducers';
import {convertStopToComplete} from '../shared/common-experiments.utils';
import {ExperimentConverterService} from '~/features/experiments/shared/services/experiment-converter.service';
import {from, of} from 'rxjs';
import {emptyAction} from '~/app.constants';
import {ReplaceHyperparamsEnum} from '~/business-logic/model/tasks/replaceHyperparamsEnum';
import {Router} from '@angular/router';
import {selectRouterConfig, selectRouterParams} from '../../core/reducers/router-reducer';
import {cloneDeep, get} from 'lodash-es';
import {CommonExperimentReverterService} from '../shared/services/common-experiment-reverter.service';
import {resetOutput} from '../actions/common-experiment-output.actions';
import {HttpErrorResponse} from '@angular/common/http';
import {selectHasDataFeature} from '~/core/reducers/users.reducer';
import {selectSelectedProject} from '../../core/reducers/projects.reducer';
import {PIPELINE_INFO_ONLY_FIELDS} from '@common/pipelines-controller/controllers.consts';
import {TasksGetByIdExResponse} from '~/business-logic/model/tasks/tasksGetByIdExResponse';
import {ARTIFACTS_ONLY_FIELDS} from '@common/experiments/experiment.consts';
import {ITask} from '~/business-logic/model/al-task';
import {RefreshService} from '@common/core/services/refresh.service';
import {selectActiveWorkspace} from '@common/core/reducers/users-reducer';
import {fromFetch} from 'rxjs/fetch';
import {isFileserverUrl} from '~/shared/utils/url';
import {getExtraHeaders} from '~/features/experiments/shared/experiments.utils';
import {MESSAGES_SEVERITY} from '@common/constants';
import {Task} from '~/business-logic/model/tasks/task';
import {TasksGetAllExResponse} from '~/business-logic/model/tasks/tasksGetAllExResponse';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {UserPreferences} from '@common/user-preferences';


@Injectable()
export class CommonExperimentsInfoEffects {
  private previousSelectedLastUpdate: Date = null;
  private previousSelectedId: string;
  private userPreferences = inject(UserPreferences);


  constructor(
    private actions$: Actions,
    private store: Store,
    private apiTasks: ApiTasksService,
    private reverter: ExperimentReverterService,
    private converter: ExperimentConverterService,
    private router: Router,
    private commonExperimentReverterService: CommonExperimentReverterService,
    private refreshService: RefreshService
  ) {
  }

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(commonInfoActions.getExperimentInfo, commonInfoActions.getSelectedPipelineStep, getExperimentConfigurationNames,
      commonInfoActions.getExperiment, getPipelineConfigurationObj, commonInfoActions.getExperimentUncommittedChanges),
    filter(action => !action?.['autoRefresh']),
    map(action => activeLoader(action.type))
  ));


  private getPathsFromAction(action): string[] {
    switch (action.type) {
      case setLastTasksTab.type:
        return [`experiments.info.lastTab.${action.projectId}`];
    }
    return [];
  }

  setUserPreferences = createEffect(() => this.actions$.pipe(
    ofType(setLastTasksTab),
    concatLatestFrom(() => this.store.select(experimentInfo)),
    map(([action, state]) => {
      const paths = this.getPathsFromAction(action);
      paths.forEach(path => this.userPreferences.setPreferences(path, get(state, path.split('.').slice(2).join('.'))));
    })), {dispatch: false});


  getExperimentConfigurationNames$ = createEffect(() => this.actions$.pipe(
    ofType(getExperimentConfigurationNames),
    concatLatestFrom(() => [
      this.store.select(selectSelectedExperimentFromRouter),
      this.store.select(selectExperimentConfiguration),
      this.store.select(selectExperimentSelectedConfigObjectFromRoute)
    ]),
    filter(([, experimentId]) => !!experimentId),
    switchMap(([action, experimentId, configuration, selectedConfiguration]) => this.apiTasks.tasksGetConfigurationNames({
        tasks: [experimentId],
        skip_empty: false
      })
        .pipe(
          mergeMap(res => {
            let configurations = cloneDeep(configuration);
            if (configurations) {
              Object.keys(configurations).forEach(name => {
                if (!res.configurations[0]?.names.includes(name)) {
                  delete configurations.name;
                }
              });
            } else {
              configurations = {};
            }
            res.configurations[0]?.names.forEach(name => {
              if (!(name in configurations)) {
                configurations[name] = null;
              }
            });
            return [
              commonInfoActions.updateExperimentInfoData({
                id: experimentId,
                changes: {configuration: configurations}
              }),
              selectedConfiguration ? getExperimentConfigurationObj() : emptyAction(),
              deactivateLoader(action.type),
            ];
          }),
          catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
            addMessage('warn', 'Fetch configuration names failed', [{
              name: 'More info',
              actions: [setServerError(error, null, 'Fetch configuration names failed')]
            }])
          ])
        )
    )
  ));

  getExperimentConfigurationObj$ = createEffect(() => this.actions$.pipe(
    ofType(getExperimentConfigurationObj, getPipelineConfigurationObj),
    concatLatestFrom(() => [
      this.store.select(selectSelectedExperimentFromRouter),
      this.store.select(selectExperimentConfiguration),
      this.store.select(selectExperimentSelectedConfigObjectFromRoute)
    ]),
    filter(([action, , configuration, configObj]) => (configuration && configObj && (configObj in configuration)) || action.type === getPipelineConfigurationObj.type),
    switchMap(([action, experimentId, configuration, configObj]) => this.apiTasks.tasksGetConfigurations({
        tasks: [experimentId],
        names: [action.type === getPipelineConfigurationObj.type ? 'Pipeline' : configObj]
      })
        .pipe(
          mergeMap(res => {
            const configurationObj = {
              ...configuration,
              [action.type === getPipelineConfigurationObj.type ? 'Pipeline' : configObj]: res.configurations[0].configuration[0]
            };
            return [
              commonInfoActions.updateExperimentInfoData({
                id: experimentId,
                changes: {configuration: configurationObj}
              }),
              deactivateLoader(getExperimentConfigurationObj.type),
              deactivateLoader(getPipelineConfigurationObj.type),
              setBackdrop({active: false}),
              deactivateEdit(),
              setExperimentSaving({saving: false})
            ];
          }),
          catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
            setBackdrop({active: false}),
            deactivateEdit(),
            setExperimentSaving({saving: false}),
            addMessage('warn', 'Fetch configuration failed', [{
              name: 'More info',
              actions: [setServerError(error, null, 'Fetch configuration failed')]
            }])
          ])
        )
    )
  ));

  getPipelineStep$ = createEffect(() => this.actions$.pipe(
    ofType(commonInfoActions.getSelectedPipelineStep),
    concatLatestFrom(() => [
      this.store.select(selectRouterConfig).pipe(map(config => !!config?.includes('pipelines')))
    ]),
    switchMap(([action, pipeline]) => this.apiTasks.tasksGetByIdEx({
      id: [action.id],
      only_fields: pipeline ? PIPELINE_INFO_ONLY_FIELDS : ['name', 'comment', 'parent.name', 'parent.project.id', 'runtime', 'configuration', 'status']
    }).pipe(
      mergeMap(res =>
        [commonInfoActions.setSelectedPipelineStep({step: res?.tasks[0]}), deactivateLoader(action.type)]
      ),
      catchError(error => [
        requestFailed(error),
        deactivateLoader(action.type),
      ])
    ))
  ));

  getExperimentInfo$ = createEffect(() => this.actions$.pipe(
    ofType(commonInfoActions.getExperimentInfo, commonInfoActions.autoRefreshExperimentInfo, commonInfoActions.experimentUpdatedSuccessfully),
    concatLatestFrom(() => [
      this.store.select(selectSelectedTableExperiment),
      this.store.select(selectSelectedExperiment),
      this.store.select(selectSelectedFromTable),
      this.store.select(selectExperimentInfoData),
      this.store.select(selectAppVisible),
      this.store.select(selectRouterConfig).pipe(map(config => !!config?.includes('pipelines') || !!config?.includes('datasets')))
    ]),
    switchMap(([action, tableSelected, selected, selectedExperimentFromTable, infoData, visible, customView]) => {
      const currentSelected = tableSelected || selected;
      if (this.previousSelectedId && currentSelected?.id != this.previousSelectedId) {
        this.previousSelectedLastUpdate = null;
      }
      this.previousSelectedId = currentSelected?.id;
      if (!infoData || !currentSelected || !visible) {
        return of([action, null, tableSelected, selected, customView]);
      }

      return (selectedExperimentFromTable ?
          of(selectedExperimentFromTable) :
          this.apiTasks.tasksGetByIdEx({id: [selected.id], only_fields: ['last_change']})
            .pipe(map(res => res.tasks[0]))
      ).pipe(map(task => [action, task?.last_change ?? task?.last_update, task, selected, customView]));
    }),
    filter(([action, , tableSelected, selected]) => (action.type !== commonInfoActions.autoRefreshExperimentInfo.type || (!tableSelected) || (tableSelected?.id === selected?.id))),
    // Can't have filter here because we need to deactivate loader
    // filter(([action, selected, updateTime]) => !selected || new Date(selected.last_change) < new Date(updateTime)),
    switchMap(([action, updateTime, tableSelected, selected, customView]) => {
      // else will deactivate loader
      if (
        !updateTime ||
        (new Date(this.previousSelectedLastUpdate) < new Date(updateTime)) ||
        action.type === commonInfoActions.experimentUpdatedSuccessfully.type
      ) {
        const autoRefresh = action.type === commonInfoActions.autoRefreshExperimentInfo.type || action['autoRefresh'];
        if (action.type === commonInfoActions.autoRefreshExperimentInfo.type) {
          this.refreshService.trigger(true);
        }
        return [
          deactivateLoader(action.type),
          commonInfoActions.getExperiment({experimentId: action.id, autoRefresh}),
          ...(customView ? [] : [commonInfoActions.getExperimentUncommittedChanges({
            experimentId: action.id,
            autoRefresh
          })]),
          // clear log data if experiment was restarted
          ...(selected?.started && tableSelected?.started && selected.started !== tableSelected?.started ? [resetOutput()] : [])
        ];
      } else {
        return [deactivateLoader(action.type)];
      }
    })
  ));


  fetchExperiment$ = createEffect(() => this.actions$.pipe(
    ofType(commonInfoActions.getExperiment),
    switchMap(action => this.store.select(selectSelectedProject).pipe(
      filter(project => !!project),
      take(1),
      map(() => action))),
    concatLatestFrom(() => [
      this.store.select(selectHasDataFeature),
      this.store.select(selectRouterConfig).pipe(map(config => !!config?.includes('pipelines') || !!config?.includes('datasets')))
    ]),
    switchMap(([action, hasDataFeature, graphView]) => this.apiTasks.tasksGetByIdEx({
        id: [action.experimentId],

        only_fields: graphView ? PIPELINE_INFO_ONLY_FIELDS : getExperimentInfoOnlyFields(hasDataFeature)
      })
      .pipe(
        switchMap((res: TasksGetByIdExResponse) => {
          // fetch steps real status
          const task = res.tasks[0];
          const ids = this.getPipelineStepsIds(task);
          return graphView && task.status === TaskStatusEnum.Stopped && ids.length ?
            this.apiTasks.tasksGetAllEx({
              id: ids,
              only_fields: ['status'],
              search_hidden: true
            }).pipe(
              map((steps: TasksGetAllExResponse) => steps?.tasks.length ?
                this.updateStepsStatus(task, steps.tasks) :
                task),
            ) :
            of(res.tasks[0]);
        }),
        concatLatestFrom(() => this.store.select(selectPipelineSelectedStep)),
        mergeMap(([task, selectedStep]) => {
          if (task) {
            this.previousSelectedLastUpdate = task.last_change;
            let experiment = convertStopToComplete([task])[0];
            experiment = this.commonExperimentReverterService.revertReadOnly(experiment);
            return [
              commonInfoActions.setExperimentInfoData({experiment: this.reverter.revertExperiment(experiment)}),
              commonInfoActions.setExperiment({experiment}),
              updateExperiment({id: action.experimentId, changes: experiment}),
              deactivateLoader(action.type),
              deactivateLoader(commonInfoActions.getExperimentInfo.type),
              setBackdrop({active: false}),
              deactivateEdit(),
              setExperimentSaving({saving: false}),
              graphView && selectedStep?.id ? getSelectedPipelineStep({id: selectedStep.id}) : emptyAction()
            ];
          } else {
            this.router.navigate(['']);
            return [deactivateLoader(action.type)];
          }
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          deactivateLoader(commonInfoActions.getExperimentInfo.type),
          ...(action.autoRefresh ? [] : [setServerError(error, null, 'Fetch task failed')])
        ])
      )
    )
  ));

  fetchDiff$ = createEffect(() => this.actions$.pipe(
    ofType(commonInfoActions.getExperimentUncommittedChanges),
    switchMap((action) =>

      this.apiTasks.tasksGetByIdEx({id: [action.experimentId], only_fields: ['script.diff']})
        .pipe(
          mergeMap(res => {
            const experiment = res.tasks[0];
            return [
              commonInfoActions.setExperimentUncommittedChanges({diff: experiment?.script?.diff}),
              deactivateLoader(action.type)
            ];
          }),
          catchError(() => [
            commonInfoActions.setExperimentUncommittedChanges({diff: ''}),
            deactivateLoader(action.type)
          ])
        )
    )
  ));

  fetchArtifacts$ = createEffect(() => this.actions$.pipe(
    ofType(commonInfoActions.getExperimentArtifacts),
    switchMap((action) =>

      this.apiTasks.tasksGetByIdEx({id: [action.experimentId], only_fields: ARTIFACTS_ONLY_FIELDS})
        .pipe(
          mergeMap((res: TasksGetByIdExResponse) => {
            const experiment = res.tasks[0] as unknown as ITask;
            return [commonInfoActions.setExperimentArtifacts({
              model: this.reverter.commonExperimentReverterService.revertModel(experiment),
              experimentId: action.experimentId
            })];
          }),
          catchError(e => [addMessage('error', e.toString())])
        )
    )
  ));

  downloadArtifact = createEffect(() => this.actions$.pipe(
    ofType(commonInfoActions.downloadArtifacts),
    filter(action => !!action.url),
    concatLatestFrom(() => this.store.select(selectActiveWorkspace)),
    switchMap(([action, workspace]) => action.inMemory ?
      fromFetch(action.url,
        {
          ...getExtraHeaders(workspace?.id),
          method: 'GET',
          credentials: 'include',
          mode: 'cors',
        })
        .pipe(
          switchMap(res => from(res.blob()).pipe(
            map(fileBlob => {
              const url = window.URL.createObjectURL(fileBlob);
              const a = document.createElement('a');
              a.href = url;
              a.target = '_blank';
              const header = res.headers.get('Content-Disposition');
              const parts = header!.split(';');
              a.download = parts[1].split('=')[1];
              a.click();
            })
          )),
          catchError(() => of(action.url)),
        ) :
      of(null)
        .pipe(map(() => {
          const src = new URL(action.url);
          if (isFileserverUrl(action.url)) {
            src.searchParams.set('download', '');
          }
          const a = document.createElement('a') as HTMLAnchorElement;
          a.target = '_blank';
          a.href = src.toString();
          a.click();
        }))
    ),
    catchError(() => of(commonInfoActions.downloadFailed())),
    map((status: string) => status ?
      commonInfoActions.downloadArtifacts({url: status}) :
      commonInfoActions.downloadSuccess())
  ),);


  // Changes fields which can be applied regardless of experiment draft state i.e name, comments, tags
  updateExperimentDetails$ = createEffect(() => this.actions$.pipe(
    ofType(experimentDetailsUpdated),
    concatLatestFrom(() => [
      this.store.select(selectExperimentInfoData),
      this.store.select(selectSelectedExperiment),
      this.store.select(selectExperimentFormValidity)
    ]),
    filter(([, , , valid]) => valid),
    mergeMap(([action, , selectedExperiment]) =>
      this.apiTasks.tasksUpdate({task: action.id, ...action.changes})
        .pipe(
          mergeMap((res) => {
            const changes = res?.fields || action.changes;
            return [
              commonInfoActions.experimentUpdatedSuccessfully({id: action.id}),
              updateExperiment({id: action.id, changes}),
              ...(selectedExperiment?.id === action.id ?
                  [commonInfoActions.updateExperimentInfoData({id: action.id, changes})] :
                  []
              ),
              ...(changes.tags ? [getTags({})] : [])
            ];
          }),
          catchError((err: HttpErrorResponse) => [
            requestFailed(err),
            setServerError(err, null, 'Update task failed'),
            commonInfoActions.getExperimentInfo({id: action.id})
          ])
        )
    )
  ));

  saveExperimentData$ = createEffect(() => this.actions$.pipe(
    ofType(saveExperiment),
    // Changes fields which can be applied Only on draft mode experiment
    concatLatestFrom(() => [
      this.store.select(selectExperimentInfoData),
      this.store.select(selectSelectedExperiment),
      this.store.select(selectExperimentInfoDataFreeze),
      this.store.select(selectExperimentFormValidity),
    ]),
    filter(([, , , , valid]) => valid),
    switchMap(([, infoData, selectedExperiment, infoFreeze]) =>
      this.apiTasks.tasksEdit(this.converter.convertExperiment(infoData, selectedExperiment, infoFreeze))
        .pipe(
          mergeMap(() => [
            commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id}),
          ]),
          catchError(err => [
            requestFailed(err),
            setServerError(err),
            commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id}),
            cancelExperimentEdit(),
            setBackdrop({active: false})
          ])
        )
    ),
    shareReplay(1)
  ));

  saveExperimentSectionData$ = createEffect(() => this.actions$.pipe(
    ofType(saveExperimentSection),
    concatLatestFrom(() => [this.store.select(selectSelectedExperiment)]),
    switchMap(([action, selectedExperiment]) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {type, parent, ...changes} = action;
      return this.apiTasks.tasksEdit({task: selectedExperiment.id, ...changes, ...(parent && {parent: parent.id})})
        .pipe(
          mergeMap(() => 'models' in changes ?
            [
              commonInfoActions.getExperimentArtifacts({experimentId: selectedExperiment.id}),
              deactivateEdit(),
              setBackdrop({active: false})
            ] :
            [commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id})]
          ),
          catchError(err => [
            requestFailed(err),
            setServerError(err),
            commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id}),
            cancelExperimentEdit(),
            setBackdrop({active: false})
          ])
        );
    }),
  ));

  saveExperimentHyperParams$ = createEffect(() => this.actions$.pipe(
    ofType(saveHyperParamsSection),
    concatLatestFrom(() => [
      this.store.select(selectSelectedExperiment),
      this.store.select(selectExperimentFormValidity),
      this.store.select(selectExperimentHyperParamsSelectedSectionFromRoute)
    ]),
    filter(([, , valid]) => valid),
    switchMap(([action, selectedExperiment, , section]) =>
      this.apiTasks.tasksEditHyperParams({
        task: selectedExperiment.id,
        hyperparams: action.hyperparams.length > 0 ? action.hyperparams : [{section}],
        replace_hyperparams: ReplaceHyperparamsEnum.Section
      })
        .pipe(
          mergeMap(() => [
            commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id}),
          ]),
          catchError(err => [
            requestFailed(err),
            setServerError(err),
            commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id}),
            cancelExperimentEdit(),
            setBackdrop({active: false})
          ])
        )
    ),
  ));

  saveExperimentConfigObj$ = createEffect(() => this.actions$.pipe(
    ofType(saveExperimentConfigObj),
    concatLatestFrom(() => [
      this.store.select(selectSelectedExperimentFromRouter),
    ]),
    switchMap(([action, selectedExperiment]) =>
      this.apiTasks.tasksEditConfiguration({task: selectedExperiment, configuration: action.configuration})
        .pipe(
          mergeMap(() => [
            commonInfoActions.getExperimentConfigurationObj(),
            // commonInfoActions.setExperimentSaving({saving: false}),
          ]),
          catchError(err => [
            requestFailed(err),
            setServerError(err),
            commonInfoActions.getExperimentConfigurationObj(),
            commonInfoActions.setExperimentSaving({saving: false}),
            cancelExperimentEdit(),
            setBackdrop({active: false})
          ])
        )
    ),
  ));

  deleteExperimentHyperParamsSection$ = createEffect(() => this.actions$.pipe(
    ofType(deleteHyperParamsSection),
    concatLatestFrom(() => [
      this.store.select(selectExperimentInfoData),
      this.store.select(selectSelectedExperiment),
      this.store.select(selectExperimentInfoDataFreeze),
      this.store.select(selectExperimentFormValidity),
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectExperimentHyperParamsSelectedSectionFromRoute)
    ]),
    filter(([, , , , valid]) => valid),
    switchMap(([action, , selectedExperiment, , , , section]) =>
      this.apiTasks.tasksDeleteHyperParams({task: selectedExperiment.id, hyperparams: [{section: action.section}]})
        .pipe(
          tap(() => this.router.navigateByUrl(this.router.url.replace('/hyper-param/' + section, ''))),
          mergeMap(() => [
            commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id}),
          ]),
          catchError(err => [
            requestFailed(err),
            setServerError(err),
            commonInfoActions.experimentUpdatedSuccessfully({id: selectedExperiment.id}),
            cancelExperimentEdit(),
            setBackdrop({active: false})
          ])
        )
    ),
  ));

  navigateToDataset = createEffect(() => this.actions$.pipe(
    ofType(navigateToDataset),
    switchMap(action => this.apiTasks.tasksGetByIdEx({
      id: [action.datasetId],
      only_fields: ['project.id']
    })),
    map(res => {
      if (res.tasks?.length > 0) {
        const task = res.tasks[0];
        const a = document.createElement('a');
        a.href = `/datasets/simple/${task.project.id}/tasks/${task.id}`;
        a.target = '_blank';
        a.click();
        return {type: 'none'};
      } else {
        return addMessage(MESSAGES_SEVERITY.WARN, 'Dataset not found');
      }
    }),
    catchError(() => of(addMessage(MESSAGES_SEVERITY.WARN, 'Dataset not found')))
  ));

  private getPipelineStepsIds(task: Task) {
    if (!task.runtime._pipeline_hash) {
      return [];
    }
    const pipelineStr = task?.configuration?.Pipeline?.value;
    try {
      const pipelineObj: Record<string, TreeStep> = JSON.parse(pipelineStr);
      return Object.values(pipelineObj).map(step => step.job_id);
    } catch {
      return [];
    }
  }

  private updateStepsStatus(task: Task, steps: Task[]) {
    const pipelineStr = task?.configuration?.Pipeline?.value;
    let pipelineObj: Record<string, TreeStep>;
    try {
      pipelineObj = JSON.parse(pipelineStr);
    } catch {
      return task;
    }
    const stepStatus = steps.reduce((acc, step) => {
      acc[step.id] = step.status;
      return acc;
    }, {});
    pipelineObj = Object.entries(pipelineObj).reduce((acc, [id, step]: [string, TreeStep]) => {
      acc[id] = {...step, status: stepStatus[step.job_id] ?? step.status};
      return acc;
    }, {});
    task.configuration.Pipeline.value = JSON.stringify(pipelineObj);
    return task;
  }
}
