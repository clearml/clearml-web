import {CanDeactivateFn} from '@angular/router';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {map, withLatestFrom} from 'rxjs/operators';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';


export const lastVisitedSettingTabGuard: CanDeactivateFn<unknown> = (component, currentRoute) => {
  const store = inject(Store);
  return store.select(selectRouterConfig).pipe(
    withLatestFrom(store.select(selectRouterProjectId)),
    map(([routerConfig, projectId]) => {
        const basePath = currentRoute.routeConfig.path.replace(/^.*\//, '');
        store.dispatch(currentRoute.data.lastTabAction({projectId, lastTab: routerConfig[routerConfig.indexOf(basePath) + 1]}));
        return true;
      }
    ));
};
