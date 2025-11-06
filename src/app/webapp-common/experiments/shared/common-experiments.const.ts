import {Project} from '~/business-logic/model/projects/project';

export type ChartHoverModeEnum = 'x' | 'y' | 'closest' | false | 'x unified' | 'y unified';

export const EXPERIMENTS_PAGE_SIZE = 30;
export const EXPERIMENT_TABLE_ONLY_FIELDS = ['id', 'type', 'name', 'started', 'completed', 'status', 'system_tags', 'user.name', 'last_metrics', 'last_update', 'active_duration'];

export const EXPERIMENT_GRAPH_ID_PREFIX = 'metric_name_';
export const SINGLE_GRAPH_ID_PREFIX = 'single_graph_name_';

export const LOG_BATCH_SIZE = 1000;

export enum CustomColumnMode {
  Standard,
  Metrics,
  HyperParams,
  Metadata
}

export const singleValueChartTitle = 'Summary';

export const projectsRoot = {
  name: 'Projects root',
  id: '999999999999999',
} as Project;
