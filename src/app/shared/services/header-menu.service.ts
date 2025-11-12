import {inject, Injectable} from '@angular/core';
import {headerActions} from '@common/core/actions/router.actions';
import {Store} from '@ngrx/store';
import {PROJECT_ROUTES} from '~/features/projects/projects.consts';


@Injectable({
  providedIn: 'root'
})
export class HeaderMenuService {
  private readonly store = inject(Store);

  setupProjectContextMenu(entitiesType: string, projectId: string, archive: boolean) {
    const contextMenu = PROJECT_ROUTES
      .filter(route=> !(projectId ==='*' && ['overview', 'workloads'].includes(route.header)))
      .map(route => {
        return {
          ...route,
          ...(archive && !['overview', 'workloads'].includes(route.header)  && { subHeader: '(ARCHIVED)' }),
          featureName: route.header,
          link: `projects/${projectId}/${route.header}${archive ? `?archive=${archive}` : ''}`,
        };
      });
    this.store.dispatch(headerActions.setTabs({contextMenu, active: entitiesType}));
  }
}
