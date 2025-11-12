import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {ActivatedRouteSnapshot, Params} from '@angular/router';
import ChildrenTypeEnum = ProjectsGetAllExRequest.ChildrenTypeEnum;
import {Observable, pairwise, startWith, filter, map} from 'rxjs';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {isEqual} from 'lodash-es';

export const getPipelineRequest = (nested, searchQuery, selectedProjectName, selectedProjectId): ProjectsGetAllExRequest => ({

  ...(nested ? {
    children_type: ChildrenTypeEnum.Pipeline,
    shallow_search: true,
    ...(selectedProjectName && {parent: [selectedProjectId]}),
    search_hidden: false,
  } :
  {
    search_hidden: true,
    shallow_search: false,
    name: selectedProjectName ? `^${selectedProjectName}/.pipelines/` : '/\\.pipelines/',
    system_tags: ['pipeline'],
    include_stats_filter: {system_tags: ['pipeline'], type: ['controller']}
  }),
  stats_with_children: nested
});

export const getReportRequest = (nested, searchQuery, selectedProjectName, selectedProjectId): ProjectsGetAllExRequest => ({

  children_type: ChildrenTypeEnum.Report,
  shallow_search: nested,
  search_hidden: !nested && selectedProjectName,
  ...(!nested && selectedProjectName && {name: `^${selectedProjectName}/.reports/`}),
  ...(nested && selectedProjectName && {parent: [selectedProjectId]})
});


export const getDatasetsRequest = (nested: boolean, searchQuery: any, selectedProjectName: any, selectedProjectId: any) => ({

  ...(nested ? {
    children_type: ChildrenTypeEnum.Dataset,
    shallow_search: true, ...(selectedProjectName && {parent: [selectedProjectId]}),
    search_hidden: false,
  } :
  {
    search_hidden: true,
    shallow_search: false,
    name: selectedProjectName ? `^${selectedProjectName}/.datasets/` : '/\\.datasets/',
    system_tags: ['dataset'],
    include_stats_filter: {system_tags: ['dataset'], type: ['data_processing']}
  }),
  include_dataset_stats: !nested,
  stats_with_children: nested
});

export const distinctParamsUntilChanged$ = (observable: Observable<readonly [string, Params, ISmCol[]?]>) => {
  let initial = true;
  return observable.pipe(
    startWith([null, {} as Params]),
    takeUntilDestroyed(),
    map(([projectId, queryParams]) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {q, qreg, gq, gqreg, tab, gsfilter, ...queryParamsWithoutSearch} = (queryParams ?? {});
      return [projectId, queryParamsWithoutSearch];
    }),
    pairwise(),
    filter(([[prevProjectId, prevQueryParams], [projectId, queryParams]]) => {
      if (!projectId) {
        return false;
      }
      const equal = !initial && projectId === prevProjectId && isEqual(queryParams, prevQueryParams);
      initial = false;
      return !equal;
    }),
    map(([[prev,], [projectId, queryParams]]) => [prev, projectId, queryParams] as [string, string, Params])
  )
};

export const isPipelines = (snapshot: ActivatedRouteSnapshot)=> snapshot.firstChild.firstChild.routeConfig.path === 'pipelines';
export const isReports = (snapshot: ActivatedRouteSnapshot)=> snapshot.firstChild.firstChild.routeConfig.path === 'reports';
