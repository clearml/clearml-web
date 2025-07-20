import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {EXPERIMENTS_STATUS_LABELS} from '~/shared/constants/non-common-consts';
import {DATASETS_STATUS_LABEL} from '~/features/experiments/shared/experiments.const';

export type ActiveSearchLink = 'projects' | 'experiments' | 'models' | 'pipelines' | 'datasets';

export const activeSearchLink = {
  projects: 'projects' as ActiveSearchLink,
  experiments: 'tasks' as ActiveSearchLink,
  models: 'models' as ActiveSearchLink,
  pipelines: 'pipelines' as ActiveSearchLink,
  pipelineRuns: 'pipelineRuns' as ActiveSearchLink,
  datasets: 'datasets' as ActiveSearchLink,
  openDatasetVersions: 'openDatasetVersions' as ActiveSearchLink,
  reports: 'reports' as ActiveSearchLink
};

export const SearchTabsWithTable = [activeSearchLink.models, activeSearchLink.experiments];

export const TaskStatusOptions = Object.values(TaskStatusEnum).filter(key=> !['unknown', 'publishing','closed'].includes(key));
export const TaskTypeOptions = Object.values(TaskTypeEnum).filter(key=> !['dataset_import', 'annotation','annotation_manual'].includes(key));

export interface SearchPageConfig {
  name: string;
  title?: string;
  viewAllResults: boolean;
  loadMore?: boolean;
  viewAllResultsLink?: string
}

export const activeLinksList = [
  {
    label: 'PROJECTS',
    name: activeSearchLink.projects,
    statusOptions: [],
    relevantSearchItems:{
      [activeSearchLink.projects]:{name: activeSearchLink.projects, viewAllResults: true, viewAllResultsLink: 'projects'}}
  },
  {
    label: 'DATASETS',
    name: activeSearchLink.datasets,
    statusOptions:  TaskStatusOptions,
    statusOptionsLabels: {...EXPERIMENTS_STATUS_LABELS,...DATASETS_STATUS_LABEL},
    relevantSearchItems:{
      [activeSearchLink.datasets]:{name: activeSearchLink.datasets, viewAllResults: true, viewAllResultsLink: 'datasets', title: 'Datasets'},
      [activeSearchLink.openDatasetVersions]:{name: activeSearchLink.openDatasetVersions, viewAllResults: false, title: 'Dataset Versions'},
    }
  },
  {
    label: 'TASKS',
    statusOptions:  TaskStatusOptions,
    statusOptionsLabels: EXPERIMENTS_STATUS_LABELS,
    typeOptions: TaskTypeOptions,
    name: activeSearchLink.experiments,
    relevantSearchItems:{
      [activeSearchLink.experiments]:{name: activeSearchLink.experiments, viewAllResults: true, viewAllResultsLink: 'projects/*/tasks'},
    }
  },
  {
    label: 'MODELS',
    statusOptions: ['created', 'published'],
    statusOptionsLabels: EXPERIMENTS_STATUS_LABELS,
    name: activeSearchLink.models,
    relevantSearchItems:{
      [activeSearchLink.models]:{name: activeSearchLink.models, viewAllResults: true, viewAllResultsLink: 'projects/*/models/'},
    }
  },
  {
    label: 'PIPELINES',
    name: activeSearchLink.pipelines,
    statusOptions: TaskStatusOptions,
    statusOptionsLabels: EXPERIMENTS_STATUS_LABELS,
    relevantSearchItems:{
      'pipelines':{name: 'pipelines', viewAllResults: true, title: 'Pipelines', viewAllResultsLink: 'pipelines/'},
      'pipelineRuns':{name: 'pipelineRuns', viewAllResults: false, loadMore: true, title: 'Pipeline runs'},
    }
  },
  {
    label: 'REPORTS',
    name: activeSearchLink.reports,
    statusOptions: ['created', 'published'],
    statusOptionsLabels: {created: 'Draft',  published: 'Published'},
    relevantSearchItems:{
      [activeSearchLink.reports]:{name: activeSearchLink.reports, viewAllResults: true, viewAllResultsLink: 'reports/'},
    }
  },
] as {label: string; name: string; feature?: string, typeOptions: string[],statusOptions?: string[], statusOptionsLabels?:  Record<string,string> , relevantSearchItems: Record<string, SearchPageConfig>}[];
