import {AbstractControl, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {inject} from '@angular/core';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Observable, of, switchMap, timer} from 'rxjs';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {catchError, map} from 'rxjs/operators';
import {isReadOnly} from '@common/shared/utils/is-read-only';

export const exampleProjectAsyncValidator = (): AsyncValidatorFn => {
  const projectsApi = inject(ApiProjectsService);
  return (control: AbstractControl): Observable<ValidationErrors | null> => timer(300).pipe(
    switchMap(() => projectsApi.projectsGetAllEx({
        only_fields: ['name', 'company'],
        search_hidden: true,
        page_size: 1,
        page: 0,
        _any_: {pattern: `^${escapeRegex(control.value?.trim())}$`, fields: ['name', 'id']}
      } as ProjectsGetAllExRequest).pipe(
        map(res => res.projects[0]?.name === control.value?.trim() && isReadOnly(res.projects[0]) ? {exampleProject: true} : {...control.errors}),
        catchError(() => of({...control.errors})))
    ));
};
