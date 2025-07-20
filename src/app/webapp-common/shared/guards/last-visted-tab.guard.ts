import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {isExample} from '@common/shared/utils/shared-utils';
import {concatLatestFrom} from '@ngrx/operators';
import {Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {infoModelsTabsLinks} from '@common/models/models.consts';
import {selectRouterProjectId, selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {infoTabLinks} from '~/features/experiments/experiments.consts';

export const lastVisitedTabGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);

  const addOutputSegment = route.parent.url.length === 2;
  const routerProjectIdFromParams = route.root.firstChild?.firstChild?.params.projectId;

  return store.select(route.data.lastTabSelector)
    .pipe(
      concatLatestFrom(() => [
        store.select(selectRouterProjectId),
        store.select(selectSelectedProject)
      ]),
      map(([lastTabPerProject, projectIdFromStore, project]) => {
        const effectiveProjectId = routerProjectIdFromParams ?? projectIdFromStore ?? '*';

        let baseSegments: string[];
        let defaultTabSegments: string[];
        let tabLinksConfig: { name: string; url: string[]; title?: string }[];

        if (route.params.experimentId) {
          baseSegments = ['projects', effectiveProjectId, 'tasks', route.params.experimentId];
          defaultTabSegments = ['execution'];
          tabLinksConfig = infoTabLinks;
        } else if (route.params.modelId) {
          baseSegments = ['projects', effectiveProjectId, 'models', route.params.modelId];
          defaultTabSegments = ['general'];
          tabLinksConfig = infoModelsTabsLinks;
        } else {
          return true;
        }

        // Determine the specific tab segments for the last visited tab
        const lastTabForThisProject = lastTabPerProject?.[effectiveProjectId];
        const foundLink = tabLinksConfig.find(l => l.url[0] === lastTabForThisProject);
        const targetTabSegments = !isExample(project) && foundLink ? [...foundLink.url] : [...defaultTabSegments];

        // Construct the full command array for createUrlTree
        const commands: string[] = [...baseSegments];
        if (addOutputSegment) {
          commands.push('output');
        }
        commands.push(...targetTabSegments);

        return router.createUrlTree(commands, {queryParams: route.queryParams});
      })
    );
};
