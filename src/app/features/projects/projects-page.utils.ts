import {ActivatedRouteSnapshot} from '@angular/router';
import {
  getDatasetsRequest,
  getPipelineRequest,
  getReportRequest,
  isPipelines,
  isReports
} from '@common/projects/common-projects.utils';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';

export const isDeletableProject = readyForDeletion => (readyForDeletion.experiments.unarchived + readyForDeletion.models.unarchived) === 0;

export const popupEntitiesListConst = 'tasks, pipelines or dataset';

export const getDeleteProjectPopupStatsBreakdown = (readyForDeletion, statsSubset: 'archived' | 'unarchived' | 'total', experimentCaption) => {
  const errors = [
    readyForDeletion.experiments[statsSubset] > 0 ?
      `${readyForDeletion.experiments[statsSubset]} ${experimentCaption}${readyForDeletion.experiments[statsSubset] > 1 ? 's' : ''} ` : null,
    readyForDeletion.models[statsSubset] > 0 ? readyForDeletion.models[statsSubset] + ' models ' : null,
    readyForDeletion.pipelines[statsSubset] > 0 ? readyForDeletion.pipelines[statsSubset] + ' pipelines ' : null,
    readyForDeletion.datasets[statsSubset] > 0 ? readyForDeletion.datasets[statsSubset] + ' datasets ' : null,
    readyForDeletion.reports[statsSubset] > 0 ? readyForDeletion.reports[statsSubset] + ' reports' : null,
  ].filter(error => error !== null);
  const first = errors.slice(0, -2);
  const last = errors.slice(-2);
  return [...first, last.join(' and ')].join(', ');
};

export const readyForDeletionFilter = readyForDeletion => !(readyForDeletion.experiments === null || readyForDeletion.models === null);

export const isDatasets = (snapshot: ActivatedRouteSnapshot) => snapshot.firstChild.firstChild.routeConfig.path === 'datasets';

export const routeConfToProjectType = (routeConf: string[]) => routeConf[0];

export const getFeatureProjectRequest = (snapshot: ActivatedRouteSnapshot, nested: boolean, searchQuery: any, selectedProjectName: any, selectedProjectId: any): ProjectsGetAllExRequest => {
  const pipelines = isPipelines(snapshot);
  const reports = isReports(snapshot);
  const datasets = isDatasets(snapshot);
  return {
    ...(pipelines && getPipelineRequest(nested, searchQuery, selectedProjectName, selectedProjectId)),
    ...(reports && getReportRequest(nested, searchQuery, selectedProjectName, selectedProjectId)),
    ...(datasets && getDatasetsRequest(nested, searchQuery, selectedProjectName, selectedProjectId)),
  };
};
export const activeFeatureToProjectType = (activeFeature: string) => activeFeature === 'simple' ? 'datasets' : null;

export const getSelfFeatureProjectRequest = (snapshot: ActivatedRouteSnapshot) => ({ });
