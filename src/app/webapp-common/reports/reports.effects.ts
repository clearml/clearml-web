import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Action, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {catchError, filter, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import {activeLoader, addMessage, deactivateLoader, setServerError} from '../core/actions/layout.actions';
import {requestFailed} from '../core/actions/http.actions';
import {
  addReports,
  archiveReport,
  createReport,
  deleteReport,
  deleteResource,
  getReport,
  getReports,
  getReportsTags,
  moveReport,
  navigateToProjectAfterMove,
  publishReport,
  removeReport,
  restoreReport,
  setReport,
  setReportChanges,
  setReports,
  setReportsOrderBy,
  setReportsTags,
  updateReport
} from './reports.actions';
import {ApiReportsService} from '~/business-logic/api-services/reports.service';
import {IReport, PAGE_SIZE} from './reports.consts';
import {
  selectArchiveView,
  selectNestedReports,
  selectReport,
  selectReportsOrderBy,
  selectReportsQueryString,
  selectReportsScrollId,
  selectReportsSortOrder
} from '@common/reports/reports.reducer';
import {ReportsGetAllExResponse} from '~/business-logic/model/reports/reportsGetAllExResponse';
import {Report} from '~/business-logic/model/reports/report';
import {ReportsUpdateResponse} from '~/business-logic/model/reports/reportsUpdateResponse';
import {ReportsMoveResponse} from '~/business-logic/model/reports/reportsMoveResponse';
import {
  selectHideExamples,
  selectMainPageTagsFilter,
  selectMainPageTagsFilterMatchMode, selectMainPageUsersFilter,
  selectSelectedProjectId
} from '../core/reducers/projects.reducer';
import {TABLE_SORT_ORDER} from '../shared/ui-components/data/table/table.consts';
import {selectCurrentUser, selectShowOnlyUserWork} from '../core/reducers/users-reducer';
import {escapeRegex} from '../shared/utils/escape-regex';
import {MESSAGES_SEVERITY} from '../constants';
import {MatDialog} from '@angular/material/dialog';
import {
  MoveProjectData,
  MoveProjectDialogComponent
} from '@common/experiments/shared/components/move-project-dialog/move-project-dialog.component';
import {ReportsMoveRequest} from '~/business-logic/model/reports/reportsMoveRequest';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {ReportsCreateResponse} from '~/business-logic/model/reports/reportsCreateResponse';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {HttpClient} from '@angular/common/http';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {setMainPageTagsFilter} from '@common/core/actions/projects.actions';
import {cleanTag} from '@common/shared/utils/helpers.util';
import {excludedKey, getTagsFilters} from '@common/shared/utils/tableParamEncode';
import {of} from 'rxjs';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {Project} from '~/business-logic/model/projects/project';

@Injectable()
export class ReportsEffects {
  private actions = inject(Actions);
  private store = inject(Store);
  private router = inject(Router);
  private reportsApiService = inject(ApiReportsService);
  private projectsApi = inject(ApiProjectsService);
  private http = inject(HttpClient);
  private matDialog = inject(MatDialog);

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(getReports, getReport, createReport, updateReport, restoreReport, archiveReport),
    filter(action => !action['refresh']),
    map(action => activeLoader(action.type))
  ));

  createReport$ = createEffect(() => this.actions.pipe(
    ofType(createReport),
    switchMap((action) => action.reportsCreateRequest.project !== undefined ? of(action) :
      this.projectsApi.projectsCreate({name: action.reportsCreateRequest.projectName}).pipe(
        map((res) => ({...action, reportsCreateRequest:{...action.reportsCreateRequest, project: res.id}}))
      )),
    switchMap((action) => this.reportsApiService.reportsCreate(action.reportsCreateRequest)),
    mergeMap((res: ReportsCreateResponse) => {
      this.router.navigate(['reports', res.project_id, res.id]);
      return [deactivateLoader(createReport.type)];
    }),
    catchError(err => [
      requestFailed(err),
      setServerError(err, null, 'failed to create a new report'),
      deactivateLoader(createReport.type),
    ])
  ));

  getReports = createEffect(() => this.actions.pipe(
    ofType(getReports, setReportsOrderBy),
    concatLatestFrom(() => [
      this.store.select(selectReportsScrollId),
      this.store.select(selectArchiveView),
      this.store.select(selectReportsOrderBy),
      this.store.select(selectReportsSortOrder),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectMainPageTagsFilter),
      this.store.select(selectMainPageTagsFilterMatchMode),
      this.store.select(selectCurrentUser),
      this.store.select(selectReportsQueryString),
      this.store.select(selectHideExamples),
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectMainPageUsersFilter),
    ]),
    switchMap(([action, scroll, archive, orderBy, sortOrder, showOnlyUserWork, mainPageTagsFilter, mainPageTagsFilterMatchMode, user, searchQuery, hideExamples, projectId, mainPageUsersFilter]) =>
      this.reportsApiService.reportsGetAllEx({

        only_fields: ['name', 'comment', 'company', 'tags', 'report', 'project.name', 'user.name', 'status', 'last_update', 'system_tags'] as (keyof Report)[],
        size: PAGE_SIZE,
        project: projectId === '*' ? null : projectId,
        scroll_id: action['loadMore'] ? scroll : null,
        ...(hideExamples && {allow_public: false}),
        system_tags: [archive ? '__$and' : excludedKey, 'archived'],
        ...(mainPageUsersFilter?.length > 0 && {user :mainPageUsersFilter}),
        ...(showOnlyUserWork && {user: [user.id]}),
        order_by: [sortOrder === TABLE_SORT_ORDER.DESC ? '-' + orderBy : orderBy],
        ...(mainPageTagsFilter?.length > 0 && {
          filters: {
            tags: getTagsFilters(!!mainPageTagsFilterMatchMode, mainPageTagsFilter),
          }
        }),
        ...(searchQuery?.query && {
          _any_: {
            pattern: searchQuery.regExp ? searchQuery.query : escapeRegex(searchQuery.query),
            fields: ['id', 'name', 'tags', 'project', 'comment', 'report']
          }
        })

      })
        .pipe(
          mergeMap((res: ReportsGetAllExResponse) => [
            deactivateLoader(action.type),
            action['loadMore'] ?
              addReports({
                reports: res.tasks as IReport[],
                scroll: res.scroll_id,
                noMoreReports: res.tasks.length < PAGE_SIZE
              }) :
              setReports({
                reports: res.tasks as IReport[],
                scroll: res.scroll_id,
                noMoreReports: res.tasks.length < PAGE_SIZE
              })
          ]),
          catchError(err => [
            requestFailed(err),
            setServerError(err, null, 'failed to fetch reports'),
            deactivateLoader(action.type),
          ])
        )
    )
  ));

  getReportsTags = createEffect(() => this.actions.pipe(
    ofType(getReportsTags),
    switchMap(() => this.reportsApiService.reportsGetTags({})),
    concatLatestFrom(() => this.store.select(selectMainPageTagsFilter)),
    mergeMap(([res, fTags]) => [
      setReportsTags({tags: res.tags}),
      ...(fTags?.length > 0 && fTags?.some(fTag => !res.tags.includes(cleanTag(fTag))) ?
        [
          setMainPageTagsFilter({
            tags: fTags.filter(fTag => res.tags.includes(cleanTag(fTag))),
            feature: 'reports'
          })
        ] : []),
    ]),
    catchError(err => [
      requestFailed(err),
      setServerError(err, null, 'failed to fetch reports'),
    ])
  ));

  getReport = createEffect(() => this.actions.pipe(
    ofType(getReport),
    switchMap((action) => this.store.select(selectActiveWorkspaceReady).pipe(
      filter(ready => ready),
      map(() => action))),
    switchMap(action => this.reportsApiService.reportsGetAllEx({
      id: [action.id],

      only_fields: ['name', 'status', 'company.id', 'user.id', 'comment', 'report', 'tags', 'system_tags', 'report_assets', 'project.name']
    })),
    tap(res => {
      if (res.tasks.length === 0) {
        this.router.navigateByUrl('/404');
      }
    }),
    mergeMap((res: ReportsGetAllExResponse) => [
      setReport({report: res.tasks[0] as IReport}),
      deactivateLoader(getReport.type),
    ]),
    catchError(err => [
      deactivateLoader(getReport.type),
      requestFailed(err),
      setServerError(err, null, 'failed to fetch report'),
    ])
  ));

  updateReport = createEffect(() => this.actions.pipe(
    ofType(updateReport),
    switchMap(action => this.reportsApiService.reportsUpdate({
        task: action.id,
        ...action.changes
      }).pipe(
        mergeMap((res: ReportsUpdateResponse) => [
          setReportChanges({id: action.id, changes: {...res.fields, ...action.changes}}),
          deactivateLoader(action.type),
        ]),
        catchError(err => [
          deactivateLoader(action.type),
          requestFailed(err),
          setServerError(err, null, 'failed to update report'),
        ])
      )
    )
  ));

  moveReport = createEffect(() => this.actions.pipe(
    ofType(moveReport),
    switchMap(action =>
      this.matDialog.open<MoveProjectDialogComponent, MoveProjectData, Project>(MoveProjectDialogComponent, {
        data: {
          currentProjects: [action.report.project?.id ?? (typeof action.report.project === 'string' ? action.report.project : action.report.project.id)],
          defaultProject: action.report.project,
          reference: action.report.name,
          allowRootProject: true,
          type: EntityTypeEnum.report
        }
      }).afterClosed()
        .pipe(
          filter(project => !!project),
          map(project => ({task: action.report.id, project: project.id, project_name: project.name}))
        )
    ),
    switchMap((moveRequest: ReportsMoveRequest) => this.reportsApiService.reportsMove(moveRequest)
      .pipe(
        concatLatestFrom(() => [
          this.store.select(selectSelectedProjectId),
          this.store.select(selectNestedReports)
        ]),
        mergeMap(([res, projectId, nested]: [ReportsMoveResponse, string, boolean]) => [
          setReportChanges({
            id: moveRequest.task,
            filterOut: projectId && (projectId !== '*' || nested) && projectId !== moveRequest.project,
            changes: {
              project: (moveRequest.project ?
                {id: res.project_id, name: moveRequest.project_name} :
                {id: res.project_id, name: moveRequest.project_name ?? 'Root project'})
            }
          }),
          deactivateLoader(moveReport.type),
          addMessage(MESSAGES_SEVERITY.SUCCESS, `Report moved successfully to ${moveRequest.project_name ?? 'Projects root'}`),
          navigateToProjectAfterMove({projectId: res.project_id})
        ]),
        catchError(err => [
          deactivateLoader(moveReport.type),
          requestFailed(err),
          setServerError(err, null, 'failed to move report'),
        ])
      )
    )
  ));

  navigateToProjectAfterMove = createEffect(() => this.actions.pipe(
    ofType(navigateToProjectAfterMove),
    concatLatestFrom(() => this.store.select(selectReport)),
    filter(([, report]) => !!report?.id),
    tap(([action, report]) => {
      this.router.navigateByUrl(`reports/${action.projectId}/${report.id}`);
    }),
  ), {dispatch: false});

  publishReport = createEffect(() => this.actions.pipe(
    ofType(publishReport),
    switchMap(action => this.reportsApiService.reportsPublish({task: action.id})
      .pipe(
        mergeMap((res: ReportsUpdateResponse) => [
          setReportChanges({id: action.id, changes: res.fields}),
          deactivateLoader(action.type),
        ]),
        catchError(err => [
          deactivateLoader(action.type),
          requestFailed(err),
          setServerError(err, null, 'failed to publish report'),
        ])
      )
    )
  ));

  archiveReport = createEffect(() => this.actions.pipe(
    ofType(archiveReport),
    switchMap((action) => this.reportsApiService.reportsArchive({task: action.report.id})
      .pipe(
        mergeMap(() => {
          const undoActions = [
            {
              name: 'Undo', actions: [
                restoreReport({report: action.report, skipUndo: true})
              ]
            }
          ];
          return [
            deactivateLoader(action.type),
            getReports(),
            ...(!action.skipUndo ?
              [addMessage(MESSAGES_SEVERITY.SUCCESS, 'Report archived successfully', [null, ...undoActions
              ].filter(a => a))] : []),
            setReportChanges({
              id: action.report.id,
              changes: {system_tags: (action.report.system_tags || []).concat('archived')}
            })
          ];
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          setServerError(error, null, 'Failed To Archive reports')
        ])
      )
    )
  ));


  restoreReport = createEffect(() => this.actions.pipe(
    ofType(restoreReport),
    switchMap((action) => this.reportsApiService.reportsUnarchive({task: action.report.id})
      .pipe(
        mergeMap(() => {
          const undoActions = [
            {
              name: 'Undo', actions: [
                archiveReport({report: action.report, skipUndo: true}),
              ]
            }
          ];
          const actions: Action[] = [
            deactivateLoader(action.type),
            getReports(),
            ...(!action.skipUndo ?
              [(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Report restored successfully', [null, ...undoActions].filter(a => a)))] : []),
            setReportChanges({
              id: action.report.id,

              changes: {system_tags: (action.report.system_tags || []).filter(tag => tag !== 'archived')}
            })
          ];
          return actions;
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          setServerError(error, null, 'Failed To restore reports')
        ])
      )
    )
  ));

  deleteReport = createEffect(() => this.actions.pipe(
    ofType(deleteReport),
    switchMap(action => this.matDialog.open(
      ConfirmDialogComponent,
      {
        data: {
          title: 'DELETE',
          body: '<p class="text-center">Permanently Delete Report</p>',
          yes: 'DELETE',
          no: 'Cancel',
          iconClass: 'al-ico-trash',
          width: 430
        }
      }).afterClosed().pipe(
      filter(confirm => !!confirm),
      switchMap(() => this.reportsApiService.reportsDelete({task: action.report.id})),
      mergeMap(() => {
        this.router.navigate(['reports'], {queryParamsHandling: 'merge'});
        return [
          removeReport({id: action.report.id}),
          getReports(),
          deactivateLoader(action.type),
          addMessage(MESSAGES_SEVERITY.SUCCESS, 'Report deleted successfully')
        ];
      }),
      catchError(error => [
        requestFailed(error),
        deactivateLoader(action.type),
        setServerError(error, null, 'Failed To delete reports')
      ])
    )),
  ));

  deleteResource = createEffect(() => this.actions.pipe(
    ofType(deleteResource),
    switchMap(action => this.http.delete(action.resource)
      .pipe(
        catchError(() => [addMessage(MESSAGES_SEVERITY.ERROR, 'failed to delete resource')]),
        concatLatestFrom(() => this.store.select(selectReport)),
        mergeMap(([, report]) => [updateReport({
          id: report.id,
          changes: {
            report_assets: report.report_assets?.filter(r => r !== action.resource),
          }
        })])
      )
    )
  ));
}
