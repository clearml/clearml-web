import {AbstractControl, AsyncValidatorFn} from '@angular/forms';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {of} from 'rxjs';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {catchError, delay, map, switchMap} from 'rxjs/operators';
import {ProjectsGetAllExResponse} from '~/business-logic/model/projects/projectsGetAllExResponse';

export const uniqueProjectValidator = (
  projectsApi: ApiProjectsService,
  allowedPath?: string,
  initialValue?: string
): AsyncValidatorFn => {

  return (control: AbstractControl) => {
    const nameControl = control.get<string>('name');
    const parentControl = control.get<string>('parent');
    const pattern = (parentControl.value && parentControl.value !== 'Projects root' ? `${parentControl.value}/${nameControl.value}` : nameControl.value).trim();

    if (!(nameControl.value?.length > 0) || pattern === allowedPath || nameControl.value === initialValue) {
      nameControl.setErrors(null);
      return of(null);
    }
    return of(null)
      .pipe(
        delay(300),
        switchMap(() =>
          projectsApi.projectsGetAllEx({
            name: `^${escapeRegex(pattern)}$`,
            only_fields: ['id', 'name'],
            search_hidden: true
          })
        ),
        map((res: ProjectsGetAllExResponse) => {
          if (res.projects.filter(project => project.name === pattern).length === 0) {
            nameControl.setErrors(null);
            return null;
          }
          nameControl.setErrors({uniqueProject: {value: control.value}});
          return {uniqueProject: {value: control.value}};
        }),
        catchError(() => of({uniqueProject: {value: control.value}}))
      );
  };
};
