import {CanDeactivateFn} from '@angular/router';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {headerActions} from '@common/core/actions/router.actions';
import {PROJECTS_FEATURES} from '~/features/projects/projects.consts';

export const resetContextMenuGuard: CanDeactivateFn<any> = (component,
                                                            currentRoute,
                                                            currentState,
                                                            nextState) => {
  const numberOfTabsChange = (currentRoute.params?.projectId === '*' && !nextState.url.includes('*')) ||
    nextState.url.includes('*') && !currentState.url.includes('*') ;

  if (numberOfTabsChange || !(nextState.url.includes('projects') && (PROJECTS_FEATURES.some((ent)=> nextState.url.includes('/'+ ent))))){
    const store = inject(Store);
    store.dispatch(headerActions.reset());
  }
  return true;
};
