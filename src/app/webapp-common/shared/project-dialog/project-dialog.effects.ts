import * as newProjectActions from './project-dialog.actions';
import {activeLoader, addMessage, deactivateLoader} from '../../core/actions/layout.actions';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {requestFailed} from '../../core/actions/http.actions';
import {Injectable} from '@angular/core';
import {CREATION_STATUS} from './project-dialog.reducer';
import {catchError, filter, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {selectActiveWorkspace} from '../../core/reducers/users-reducer';
import {ShortProjectNamePipe} from '../pipes/short-project-name.pipe';
import {ProjectLocationPipe} from '../pipes/project-location.pipe';
import {MESSAGES_SEVERITY} from '@common/constants';
import {MatDialog} from '@angular/material/dialog';

@Injectable()
export class ProjectDialogEffects {
  constructor(
    private actions: Actions,
    private projectsApiService: ApiProjectsService,
    private router: Router,
    private store: Store,
    private dialog: MatDialog
  ) {
  }

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(newProjectActions.createNewProject, newProjectActions.updateProject),
    map(action => activeLoader(action.type))
  ));

  navigateToNewProject = createEffect(() => this.actions.pipe(
    ofType(newProjectActions.navigateToNewProject),
    filter(action => !!action.id),
    map((action) => this.router.navigateByUrl(`projects/${action.id}`))
  ), {dispatch: false});

  createProject = createEffect(() => this.actions.pipe(
    ofType(newProjectActions.createNewProject),
    concatLatestFrom(() => this.store.select(selectActiveWorkspace)),
    switchMap(([action]) => this.projectsApiService.projectsCreate({...action.req})
      .pipe(
        tap(() => this.dialog.getDialogById(action.dialogId).close(true)),
        mergeMap(() => [
            deactivateLoader(action.type),
            newProjectActions.setCreationStatus({status: CREATION_STATUS.SUCCESS}),
            addMessage(MESSAGES_SEVERITY.SUCCESS, `${(new ShortProjectNamePipe()).transform(action.req.name)} has been created successfully in ${(new ProjectLocationPipe()).transform(action.req.name)}`)
          ]
        ),
        catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, 'Project Created Failed'), newProjectActions.setCreationStatus({status: CREATION_STATUS.FAILED})])
      )
    )
  ));

  updateProject = createEffect(() => this.actions.pipe(
    ofType(newProjectActions.updateProject),
    concatLatestFrom(() => this.store.select(selectActiveWorkspace)),
    switchMap(([action]) => this.projectsApiService.projectsUpdate({...action.req})
      .pipe(
        tap(() => this.dialog.getDialogById(action.dialogId).close(true)),
        mergeMap(() => [
            deactivateLoader(action.type),
            newProjectActions.setCreationStatus({status: CREATION_STATUS.SUCCESS}),
            addMessage(MESSAGES_SEVERITY.SUCCESS, `${(new ShortProjectNamePipe()).transform(action.req.name)} has been updated successfully in ${(new ProjectLocationPipe()).transform(action.req.name)}`),
          ]
        ),
        catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, 'Project Created Failed'), newProjectActions.setCreationStatus({status: CREATION_STATUS.FAILED})])
      )
    )
  ));

  moveProject = createEffect(() => this.actions.pipe(
    ofType(newProjectActions.moveProject),
    concatLatestFrom(() => this.store.select(selectActiveWorkspace)),

    switchMap(([action]) => this.projectsApiService.projectsMove({project: action.project, new_location: action.new_location})
      .pipe(
        tap(() => this.dialog.getDialogById(action.dialogId).close(true)),
        mergeMap(() => [
            deactivateLoader(action.type),
            newProjectActions.setCreationStatus({status: CREATION_STATUS.SUCCESS}),
            addMessage(MESSAGES_SEVERITY.SUCCESS, `${action.projectName} has been moved from ${action.fromName} to ${action.toName}`)
          ]
        ),
        catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, 'Project Move Failed'), newProjectActions.setCreationStatus({status: CREATION_STATUS.FAILED})])
      )
    )
  ));
}
