import {deactivateLoader, setServerError} from '@common/core/actions/layout.actions';
import {selectSelectedProjectId} from '@common/core/reducers/projects.reducer';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {requestFailed} from '@common/core/actions/http.actions';
import {inject, Injectable} from '@angular/core';
import {catchError, filter, map, mergeMap, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {emptyAction} from '~/app.constants';
import {Action, MemoizedSelector, Store} from '@ngrx/store';
import {forkJoin, Observable, of} from 'rxjs';
import {fromFetch} from 'rxjs/fetch';
import {AdminService} from '~/shared/services/admin.service';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {
  addFailedDeletedFile,
  addFailedDeletedFiles,
  deleteEntities,
  deleteFileServerSources,
  deleteS3Sources,
  setFailedDeletedEntities,
  setNumberOfSourcesToDelete
} from './common-delete-dialog.actions';
import {selectSelectedExperiments} from '@common/experiments/reducers';
import {TasksDeleteResponse} from '~/business-logic/model/tasks/tasksDeleteResponse';
import {selectSelectedModels} from '@common/models/reducers';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {CloudProviders} from './common-delete-dialog.reducer';
import {selectProjectForDelete} from '@common/projects/common-projects.reducer';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {activateEdit, experimentUpdatedSuccessfully} from '@common/experiments/actions/common-experiments-info.actions';
import {activateModelEdit} from '@common/models/actions/models-info.actions';
import {ModelsDeleteManyResponse} from '~/business-logic/model/models/modelsDeleteManyResponse';
import {TasksDeleteManyResponse} from '~/business-logic/model/tasks/tasksDeleteManyResponse';
import {ConfigurationService} from '../../services/configuration.service';
import {isFileserverUrl} from '~/shared/utils/url';
import {TasksResetManyResponseSucceeded} from '~/business-logic/model/tasks/tasksResetManyResponseSucceeded';
import {updateManyExperiment} from '@common/experiments/actions/common-experiments-view.actions';
import {getBucketAndKeyFromSrc, SignResponse} from '@common/settings/admin/base-admin-utils';
import {ApiPipelinesService} from '~/business-logic/api-services/pipelines.service';
import {PipelinesDeleteRunsResponse} from '~/business-logic/model/pipelines/pipelinesDeleteRunsResponse';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ErrorService} from '@common/shared/services/error.service';
import {Router} from '@angular/router';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {selectionDisabledReset} from '@common/shared/entity-page/items.utils';

@Injectable()
export class DeleteDialogEffectsBase {
  private store: Store;
  private tasksApi: ApiTasksService;
  private modelsApi: ApiModelsService;
  private projectsApi: ApiProjectsService;
  private adminService: AdminService;
  private configService: ConfigurationService;
  private pipelinesService: ApiPipelinesService;
  private dialog: MatDialog;
  private errorService: ErrorService;
  private router: Router;

  constructor(protected actions$: Actions) {
    this.store = inject(Store);
    this.tasksApi = inject(ApiTasksService);
    this.modelsApi = inject(ApiModelsService);
    this.projectsApi = inject(ApiProjectsService);
    this.adminService = inject(AdminService);
    this.configService = inject(ConfigurationService);
    this.pipelinesService = inject(ApiPipelinesService);
    this.dialog = inject(MatDialog);
    this.errorService = inject(ErrorService);
    this.router = inject(Router);
  }

  deleteEntityApi(entityType: EntityTypeEnum, entities: any[], deleteArtifacts?: boolean,
                  resetMode?: boolean, projectId?: string, includeChildren?: boolean): Observable<{
    failed: any[];
    urlsToDelete: string[];
    succeeded?: TasksResetManyResponseSucceeded[]
  }> {
    const filtered = resetMode ? selectionDisabledReset(entities).selectedFiltered : entities;
    const ids = filtered.map(entity => entity.id as string);
    switch (entityType) {
      case EntityTypeEnum.controller:
        return this.pipelinesService.pipelinesDeleteRuns({
          ids,
          project: projectId || entities[0]?.project?.id,
          include_pipeline_steps: includeChildren
        })
          .pipe(
            map((res: PipelinesDeleteRunsResponse) => ({
              failed: res.failed,
              succeeded: res.succeeded,
              urlsToDelete: []
            })));
      case EntityTypeEnum.dataset:
      case EntityTypeEnum.experiment:

        return (resetMode ? this.tasksApi.tasksResetMany({
          ids,
          delete_external_artifacts: deleteArtifacts,
          delete_output_models: deleteArtifacts,
          return_file_urls: true,
          force: true
        }) : this.tasksApi.tasksDeleteMany({
          ids,
          delete_external_artifacts: deleteArtifacts,
          delete_output_models: deleteArtifacts,
          return_file_urls: true,
          force: true
        })).pipe(
          map((res: TasksDeleteManyResponse) => ({
            failed: res.failed,
            succeeded: res.succeeded,
            urlsToDelete: res.succeeded.map(deletedExperiment =>
              [...deletedExperiment.urls.artifact_urls, ...deletedExperiment.urls.event_urls, ...deletedExperiment.urls.model_urls]
            ).flat()
          })));
      case EntityTypeEnum.model:
        return this.modelsApi.modelsDeleteMany({ids, force: true}).pipe(
          map((res: ModelsDeleteManyResponse) => ({
            failed: res.failed,
            urlsToDelete: [...res.succeeded.map(model => model.url)]
          })));
      case EntityTypeEnum.project:
      case EntityTypeEnum.pipeline:
      case EntityTypeEnum.openDataset:

        return this.projectsApi.projectsDelete({
          project: entities[0].id,
          delete_contents: true,
          delete_external_artifacts: deleteArtifacts
        }).pipe(
          map((res: TasksDeleteResponse) => ({
            urlsToDelete: [...res.urls.model_urls, ...res.urls.artifact_urls, ...res.urls.event_urls],
            failed: []
          })));
      default:
        return of({urlsToDelete: [], failed: []});
    }
  }

  // @ts-ignore
  getEntitySelector(entityType: EntityTypeEnum): MemoizedSelector<any, any[]> {
    switch (entityType) {
      case EntityTypeEnum.dataset:
      case EntityTypeEnum.controller:
      case EntityTypeEnum.experiment:
        return selectSelectedExperiments;
      case EntityTypeEnum.model:
        return selectSelectedModels;
      case EntityTypeEnum.openDataset:
      case EntityTypeEnum.pipeline:
      case EntityTypeEnum.project:
        return selectProjectForDelete;
    }
    return null;
  }

  pauseAutorefresh(entityType: EntityTypeEnum): Action[] {
    switch (entityType) {
      case EntityTypeEnum.experiment:
        return [activateEdit('delete')];
      case EntityTypeEnum.model:
        return [activateModelEdit('delete')];
      default:
        return [emptyAction()];
    }
  }

  deleteEntitiesEffect = createEffect(() => this.actions$.pipe(
    ofType(deleteEntities),
    map(action => action),
    mergeMap((action) => of(action).pipe(
      withLatestFrom(
        this.store.select(this.getEntitySelector(action.entityType)),
      ),
      map(([, entities]) => action.entity ? [action.entity] : entities),
      // switchMap(entities => action.includeChildren ? getChildrenExperiments(this.tasksApi, entities)
      //   .pipe(map((children: Task[]) => [...children, ...entities])) : of(entities)),
      withLatestFrom(this.store.select(selectSelectedProjectId),
        this.store.select(selectSelectedExperiment)
      ),
      switchMap(([entities, projectId, selectedExperiment]) =>
        this.deleteEntityApi(
          action.entityType,
          entities,
          action.deleteArtifacts,
          action.resetMode,
          projectId,
          action.includeChildren
        )
          .pipe(
            map(({failed, succeeded, urlsToDelete}) => [
              this.parseErrors(failed, entities),
              this.getUrlsPerProvider(action.deleteArtifacts ? urlsToDelete : []),
              succeeded,
              selectedExperiment
            ]),
            mergeMap(([failed, /*urlsPerSource*/, succeeded, selectedExperiment]: [{
                id: string;
                name: string;
                message: string
              }[], Record<CloudProviders, string[]>, TasksResetManyResponseSucceeded[],IExperimentInfo ]) => [
                ...this.pauseAutorefresh(action.entityType),
                setNumberOfSourcesToDelete({numberOfFiles: 0}),//Object.values(urlsPerSource).flat().length}), // Currently deleting only in BE
                setFailedDeletedEntities({failedEntities: failed}),
                // deleteFileServerSources({files: urlsPerSource['fs']}), // Currently deleting only in BE
                // deleteS3Sources({files: urlsPerSource['s3']}),
                // deleteGoogleCloudeSource(urlsPerSource['gc']),
                // deleteAzure(urlsPerSource['azure']),
                // addFailedDeletedFiles({filePaths: urlsPerSource['misc']}), // Currently deleting only in BE - no need to count files
                action.resetMode ? updateManyExperiment({changeList: succeeded}) : emptyAction(),
              (action.resetMode && selectedExperiment?.id) ? experimentUpdatedSuccessfully({id: selectedExperiment?.id}) : emptyAction()
              ]
            ),
            catchError(error => {
              if (this.errorService.lastRunError(error.error)) {
                return this.handleLastRun(projectId || entities[0]?.project?.id);
              }
              return [
                requestFailed(error),
                deactivateLoader(action.type),
                setServerError(error, null, `Can't delete ${action.entityType} ${error?.meta?.error_data?.id || ''}`)
              ];
            })
          )
      )
    )),
  ));

  deleteFileServerSourcesEffect = createEffect(() => this.actions$.pipe(
    ofType(deleteFileServerSources),
    mergeMap(action => forkJoin(action.files.map(url =>
      this.adminService.signUrlIfNeeded(url, {skipFileServer: false}).pipe(
        switchMap((signResponse: SignResponse) =>
          fromFetch(
            signResponse.signed,
            {
              method: 'DELETE',
              credentials: this.configService.getStaticEnvironment().useFilesProxy ? 'include' : 'omit'
            }
          )
        ),
        mergeMap(res => {
          if ((res[0]?.status || res?.status) !== 200) {
            return [addFailedDeletedFile({filePath: decodeURIComponent(res[0]?.url || res?.url)})];
          } else {
            return [setNumberOfSourcesToDelete({numberOfFiles: -1})];
          }
        }),
        catchError(() => [setNumberOfSourcesToDelete({numberOfFiles: -1})]),
      )
    ))),
    mergeMap(a => a as Action[])
  ));

  deleteS3SourcesEffect = createEffect(() => this.actions$.pipe(
    ofType(deleteS3Sources),
    filter(action => action.files.length > 0),
    map(action => {
      const filesPerBucket = action.files.reduce((acc, fileSrc) => {
        const {Bucket: bucket} = getBucketAndKeyFromSrc(fileSrc);
        if (!acc[bucket]) {
          acc[bucket] = [];
        }
        acc[bucket].push(fileSrc);
        return acc;
      }, {} as Record<string, string[]>);
      return Object.entries(filesPerBucket);
    }),
    mergeMap(([[, files]]) => this.adminService.deleteS3Files(files, false)),
    // mergeMap(fetchPromise => forkJoin(fetchPromise)),
    map((failedFiles: { success: boolean; files: string[] }) => {
      if (failedFiles.success) {
        return setNumberOfSourcesToDelete({numberOfFiles: failedFiles.files.length});
      } else {
        return addFailedDeletedFiles({filePaths: failedFiles.files});
      }
    }),
    // TODO: return the correct number of files
    catchError(() => [setNumberOfSourcesToDelete({numberOfFiles: -1})])
  ));

  public getUrlsPerProvider(commutativeUrls: string[]): Record<CloudProviders, string[]> {

    return commutativeUrls.reduce((acc, url) => {
      const sourceType = this.getSourceType(url);
      url && acc[sourceType].push(url);
      return acc;
    }, {fs: [], gc: [], s3: [], azure: [], misc: []});
  }

  parseErrors(failed, entities): { id: string; name: string; message: string }[] {
    return failed.map(failedEntity => ({
      id: failedEntity.id,
      name: entities.find(entity => entity.id === failedEntity.id)?.name || failedEntity.id,
      message: failedEntity.error.msg
    }));
  }

  getSourceType(src: string): CloudProviders {
    if (isFileserverUrl(src)) {
      return 'fs';
    } else {
      return 'misc';
    }
    // else if (this.adminService.isS3Url(src)) {
    //   return 's3';
    // } else if (this.adminService.isGoogleCloudUrl(src)) {
    //   return 'gc';
    // } else if (this.adminService.isAzureUrl(src)) {
    //   return 'azure';
    // } else {
    //   return 'misc';
    // }
  }

  private handleLastRun(project: string) {
    return this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Pipeline',
        body: 'Deleting the last run of a pipeline will also delete the pipeline',
        iconClass: 'al-ico-alert',
        iconColor: 'var(--color-warning)',
        yes: 'DELETE',
        no: 'Cancel'
      } as ConfirmDialogConfig
    }).afterClosed()
      .pipe(
        tap(confirm => !confirm && this.dialog.closeAll()),
        filter(confirm => !!confirm),
        tap(() => this.router.navigate(['pipelines'])),
        switchMap(() => [
          deleteEntities({
            entityType: EntityTypeEnum.project,
            entity: {id: project},
            deleteArtifacts: true
          })])
      );
  }
}
