import {createAction, props} from '@ngrx/store';
import {ExperimentSettings} from '../reducers/experiment-output.reducer';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';
import {
  EventsGetTaskSingleValueMetricsResponseTasks
} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseTasks';
import {Task} from '~/business-logic/model/tasks/task';

export type GroupByCharts = 'metric' | 'none';

export const groupByCharts = {
  metric: 'metric' as GroupByCharts,
  none: 'none' as GroupByCharts
};

export interface Log {
  timestamp: number;
  type: 'log';
  task: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  worker: string;
  msg: string;
  metric: string;
  variant: string;
}

export interface SeriesData {
  name: string;
  x: number[];
  y: number[];
}

export interface HistogramCharts {
  [metric: string]: { [variant: string]: SeriesData };
}

export const EXPERIMENTS_OUTPUT_PREFIX = 'EXPERIMENTS_OUTPUT_';

export const resetOutput = createAction(EXPERIMENTS_OUTPUT_PREFIX + 'RESET_OUTPUT');

export const experimentPlotsRequested = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'EXPERIMENT_PLOTS_REQUESTED',
  props<{ task: string; refresh?: boolean}>()
);

export const experimentScalarRequested  = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'EXPERIMENT_SCALAR_REQUESTED',
  props<{experimentId: string; model?: boolean; refresh?: boolean; skipSingleValue?: boolean}>()
);

export const setHistogram = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_HISTOGRAM',
  props<{histogram: HistogramCharts; axisType: ScalarKeyEnum}>()
);

export const setExperimentPlots = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_PLOTS',
  props<{plots: MetricsPlotEvent[]}>()
);

export const getExperimentLog = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'GET_EXPERIMENT_LOG',
  props<{ id: string; direction?: string; refresh?: boolean; from?: number; autoRefresh?: boolean }>()
);

export const setExperimentLog = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_LOG',
  props<{ events: any[]; direction?: string; total: number; refresh?: boolean }>()
);

export const setExperimentLogLoading = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_LOG loading',
  props<{loading: boolean}>()
);

export const setExperimentLogAtStart = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_LOG as start',
  props<{atStart: boolean}>()
);

export const setExperimentScalarSingleValue = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_SCALAR_SINGLE_VALUE',
  props<EventsGetTaskSingleValueMetricsResponseTasks >()
);

export const setExperimentMetricsVariantValues = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_METRICS_VARIANT_VALUES',
  props<{lastMetrics: Task['last_metrics']} >()
);

export const setExperimentSettings = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'UPDATE_EXPERIMENT_SETTINGS',
  props<{ id: string; changes: Partial<ExperimentSettings> }>()
);

export const removeExperimentSettings = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'REMOVE_EXPERIMENT_SETTINGS',
  props<{ id: string }>()
);

export const setExperimentMetricsSearchTerm = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_EXPERIMENT_METRICS_SEARCH_TERM',
  props<{ searchTerm: string }>()
);

export const resetExperimentMetrics  = createAction(EXPERIMENTS_OUTPUT_PREFIX + 'RESET_EXPERIMENT_METRICS');

export const setLogFilter = createAction(
  EXPERIMENTS_OUTPUT_PREFIX + 'SET_LOG_FILTER',
  props<{filter: string}>()
);

export const resetLogFilter = createAction(EXPERIMENTS_OUTPUT_PREFIX + 'RESET_LOG_FILTER');
export const downloadFullLog = createAction(EXPERIMENTS_OUTPUT_PREFIX + 'DOWNLOAD_FULL_LOG', props<{ experimentId: string }>());
export const toggleSettings = createAction(EXPERIMENTS_OUTPUT_PREFIX + 'TOGGLE_SETTINGS');
export const toggleMetricValuesView = createAction(EXPERIMENTS_OUTPUT_PREFIX + 'TOGGLE_METRIC_VALUES_VIEW');
export const setGraphsPerRow = createAction(EXPERIMENTS_OUTPUT_PREFIX + 'SET_GRAPHS_PER_ROW', props<{ graphsPerRow: number }>());

