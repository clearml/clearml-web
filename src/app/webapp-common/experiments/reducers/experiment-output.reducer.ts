import * as actions from '../actions/common-experiment-output.actions';
import {GroupByCharts, HistogramCharts, Log} from '../actions/common-experiment-output.actions';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {sortBy} from 'lodash-es';
import {LOG_BATCH_SIZE} from '../shared/common-experiments.const';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';
import {EventsGetTaskSingleValueMetricsResponseValues} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseValues';
import {createReducer, on} from '@ngrx/store';
import {SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {Task} from '~/business-logic/model/tasks/task';


export interface ExperimentOutputState {
  metricsMultiScalarsCharts: any;
  metricsHistogramCharts: HistogramCharts;
  cachedAxisType: ScalarKeyEnum;
  metricsPlotsCharts: MetricsPlotEvent[];
  experimentLog: Log[];
  totalLogLines: number;
  beginningOfLog: boolean;
  settingsList: Record<string, ExperimentSettings | Partial<ExperimentSettings>>;
  chartSettingsPerProject: Record<string, Record<string, Partial<ExperimentSettings>>>;
  searchTerm: string;
  logFilter: string;
  logLoading: boolean;
  showSettings: boolean;
  metricValuesView: boolean;
  scalarSingleValue: EventsGetTaskSingleValueMetricsResponseValues[];
  lastMetrics: Task['last_metrics'];
  graphsPerRow: number;
}

export interface ExperimentSettings {
  id: string;
  hiddenMetricsScalar: string[];
  hiddenMetricsPlot: string[];
  selectedMetricTable: string[];
  selectedMetricsScalar: string[];
  selectedMetricsPlot: string[];
  selectedHyperParams: string[];
  selectedMetric: string;
  smoothWeight: number;
  smoothSigma: number;
  smoothType: SmoothTypeEnum;
  xAxisType: ScalarKeyEnum;
  groupBy: GroupByCharts;
  showOriginals: boolean;
  lastModified?: number;
  valueType?: 'min_value' | 'max_value' | 'value';
  projectLevel?: boolean;
  log?: boolean;
}

export const experimentOutputInitState: ExperimentOutputState = {
  metricsMultiScalarsCharts: null,
  metricsHistogramCharts: null,
  cachedAxisType: null,
  metricsPlotsCharts: null,
  experimentLog: null,
  totalLogLines: null,
  beginningOfLog: false,
  settingsList: {},
  chartSettingsPerProject: {},
  scalarSingleValue: [],
  lastMetrics: null,
  searchTerm: '',
  logFilter: null,
  logLoading: false,
  showSettings: false,
  metricValuesView: false,
  graphsPerRow: 2
};

export const experimentOutputReducer = createReducer(
  experimentOutputInitState,
  on(actions.resetOutput, (state): ExperimentOutputState => ({
    ...state,
    experimentLog: experimentOutputInitState.experimentLog,
    metricsMultiScalarsCharts: experimentOutputInitState.metricsMultiScalarsCharts,
    metricsHistogramCharts: experimentOutputInitState.metricsHistogramCharts,
    metricsPlotsCharts: experimentOutputInitState.metricsPlotsCharts
  })),
  on(actions.getExperimentLog, (state, action): ExperimentOutputState => ({
    ...state, logLoading: !action.autoRefresh, ...(action.direction === null && {experimentLog: null})
  })),
  on(actions.setExperimentLogLoading, (state, action): ExperimentOutputState => ({...state, logLoading: action.loading})),
  on(actions.setExperimentLog, (state, action): ExperimentOutputState => {
    const events = Array.from(action?.events || []).reverse();
    let currLog: Log[];
    let atStart = false;
    if (action.direction) {
      if (action.refresh) {
        currLog = events;
      } else if (action.direction === 'prev') {
        if (action.events?.length < LOG_BATCH_SIZE) {
          atStart = true;
        }
        currLog = sortBy(events.concat(state.experimentLog), 'timestamp');
        if (currLog.length > 300) {
          currLog = currLog.slice(0, 300);
        }
      } else {
        currLog = sortBy(state.experimentLog?.concat(events), 'timestamp');
        if (currLog.length > 300) {
          currLog = currLog.slice(currLog.length - 300, currLog.length);
        }
      }
    } else {
      currLog = events;
    }
    return {
      ...state,
      experimentLog: currLog,
      totalLogLines: action.total,
      beginningOfLog: atStart,
      logLoading: false
    };
  }),
  on(actions.setExperimentLogAtStart, (state, action): ExperimentOutputState => ({...state, beginningOfLog: action.atStart, logLoading: false})),
  on(actions.setExperimentMetricsSearchTerm, (state, action): ExperimentOutputState => ({...state, searchTerm: action.searchTerm})),
  on(actions.setHistogram, (state, action): ExperimentOutputState => ({...state, metricsHistogramCharts: action.histogram, cachedAxisType: action.axisType})),
  on(actions.setExperimentPlots, (state, action): ExperimentOutputState => ({...state, metricsPlotsCharts: action.plots})),
  on(actions.setExperimentScalarSingleValue, (state, action): ExperimentOutputState => ({...state, scalarSingleValue: action.values})),
  on(actions.setExperimentMetricsVariantValues, (state, action): ExperimentOutputState => ({...state, lastMetrics: action.lastMetrics})),
  on(actions.removeExperimentSettings, (state, action): ExperimentOutputState => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {[action.id]: _, ...settingsWithout} = state.settingsList;
    return {
      ...state,
      settingsList: settingsWithout
    };
  }),
  on(actions.setExperimentSettings, (state, action): ExperimentOutputState => {
    const changesWithTimestamp = {...action.changes, lastModified: (new Date()).getTime()} as ExperimentSettings;
    const discardBefore = new Date();
    discardBefore.setMonth(discardBefore.getMonth() - 2);
    const discardBeforeTime = discardBefore.getTime();

    const filteredOldSettings = Object.entries(
      state.settingsList)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([id, setting]) => setting.lastModified >= discardBeforeTime)
      .reduce((acc, [id, setting]) => {
        acc[id] = setting as ExperimentSettings;
        return acc;
      }, {} as Record<string, ExperimentSettings>);

    const newSettingsList: Record<string, ExperimentSettings> = {
      ...filteredOldSettings,
      [action.id]: {
        ...(state.settingsList[action.id] || {}),
        ...changesWithTimestamp
      }
    };
    return {
      ...state,
      settingsList: newSettingsList
    };
  }),
  on(actions.setChartSettings, (state, action): ExperimentOutputState => ({
      ...state,
      chartSettingsPerProject: {
        ...state.chartSettingsPerProject,
        [action.projectId]: {
          ...(state.chartSettingsPerProject[action.projectId] || {}),
          [action.id]: {
            ...(state.chartSettingsPerProject[action.projectId]?.[action.id] || {}),
            ...action.changes
          }
        }
      }
    })
  ),
  on(actions.resetExperimentMetrics, (state): ExperimentOutputState => ({
    ...state,
    metricsMultiScalarsCharts: experimentOutputInitState.metricsMultiScalarsCharts,
    metricsHistogramCharts: experimentOutputInitState.metricsHistogramCharts,
    metricsPlotsCharts: experimentOutputInitState.metricsPlotsCharts,
    cachedAxisType: experimentOutputInitState.cachedAxisType,
    searchTerm: ''
  })),
  on(actions.setLogFilter, (state, action): ExperimentOutputState => ({...state, logFilter: (action as ReturnType<typeof actions.setLogFilter>).filter})),
  on(actions.resetLogFilter, (state): ExperimentOutputState => ({...state, logFilter: null})),
  on(actions.toggleSettings, (state): ExperimentOutputState => ({...state, showSettings: !state.showSettings})),
  on(actions.toggleMetricValuesView, (state): ExperimentOutputState => ({...state, metricValuesView: !state.metricValuesView})),
  on(actions.setGraphsPerRow, (state, action): ExperimentOutputState => ({...state, graphsPerRow: action.graphsPerRow}))
);
