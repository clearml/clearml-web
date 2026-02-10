import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import * as actions from '../../webapp-common/core/actions/projects.actions';
import {Store} from '@ngrx/store';
import {selectSelectedProjectId, selectShowHidden} from '@common/core/reducers/projects.reducer';
import {catchError, finalize, mergeMap, switchMap} from 'rxjs/operators';
import {deactivateLoader} from '@common/core/actions/layout.actions';
import {ALL_PROJECTS_OBJECT} from '@common/core/effects/projects.effects';
import {requestFailed} from '@common/core/actions/http.actions';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {selectCurrentUser, selectShowOnlyUserWork,} from '@common/core/reducers/users-reducer';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';


@Injectable()
export class ProjectsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private projectsApi = inject(ApiProjectsService);
  private fetchingExampleExperiment: string = null;

  getSelectedProject = createEffect(() => this.actions$.pipe(
    ofType(actions.setSelectedProjectId),
    concatLatestFrom(() => [
      this.store.select(selectSelectedProjectId),
      this.store.select(selectCurrentUser),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectShowHidden),
      this.store.select(selectRouterConfig),
    ]),
    switchMap(([action, selectedProjectId, user, showOnlyUserWork, showHidden, conf]) => {
      if (!action.projectId) {
        return [
          deactivateLoader(action.type),
          actions.setSelectedProject({project: null}),
        ];
      }
      if (action.projectId === selectedProjectId) {
        return [deactivateLoader(action.type)];
      }
      if (action.projectId === '*') {
        return [
          actions.setSelectedProject({project: ALL_PROJECTS_OBJECT}),
          actions.getProjectUsers(action),
          actions.getCompanyTags(),
          deactivateLoader(action.type)];
      } else {
        const customProjectType = conf?.[0] !== 'projects';
        const deepProjectPage = conf?.[0] === 'projects' && conf?.[2] === 'projects';
        this.fetchingExampleExperiment = action.example && action.projectId;
        return this.projectsApi.projectsGetAllEx({
          /* eslint-disable @typescript-eslint/naming-convention */
          id: [action.projectId],
          include_stats: true,
          ...(!showHidden && {include_stats_filter: {system_tags: ['-pipeline', '-dataset']}}),
          ...(showOnlyUserWork && {active_users: [user.id]}),
          ...((showHidden || customProjectType) && {search_hidden: true}),
          ...((action.example !== false || this.fetchingExampleExperiment === action.projectId) && {check_own_contents: true}),
          /* eslint-enable @typescript-eslint/naming-convention */
        } as ProjectsGetAllExRequest)
          .pipe(
            finalize(() => this.fetchingExampleExperiment = null),
            mergeMap(({projects}) => {
                if (projects.length > 0) {
                  return [
                    actions.setSelectedProject({project: projects[0]}),
                    actions.getProjectUsers(action),
                    ...(!customProjectType && !deepProjectPage ? [actions.getTags()] : []),
                    actions.getCompanyTags(),
                    deactivateLoader(action.type),
                  ];
                } else {
                  return [
                    actions.setSelectedProject({project: ALL_PROJECTS_OBJECT}),
                    actions.getProjectUsers(action),
                    deactivateLoader(action.type)
                  ];
                }
              }
            ),
            catchError(error => [
              requestFailed(error),
              deactivateLoader(action.type)
            ])
          );
      }
    })
  ));
}
