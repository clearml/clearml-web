import {AbstractControl, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {inject} from '@angular/core';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Observable, of} from 'rxjs';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {catchError, map} from 'rxjs/operators';
import {isReadOnly} from '@common/shared/utils/is-read-only';

export const exampleProjectAsyncValidator = (): AsyncValidatorFn => {
  const projectsApi = inject(ApiProjectsService);
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    projectsApi.projectsGetAllEx({
      only_fields: ['name', 'company'],
      search_hidden: true,
      page_size: 1,
      page: 0,
      _any_: {pattern: `^${escapeRegex(control.value)}$`, fields: ['name', 'id']}
    } as ProjectsGetAllExRequest).pipe(
      map(res => res.projects[0]?.name === control.value && isReadOnly(res.projects[0]) ? {exampleProject: true} : null),
      catchError(() => of(null)));
};
