import {createReducer, on} from '@ngrx/store';
import {Task} from '~/business-logic/model/tasks/task';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import * as actions from '../actions/experiments-compare-charts.actions';
import {ExperimentSettings} from '../../experiments/reducers/experiment-output.reducer';
import {SelectedMetric, SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {
  EventsGetTaskSingleValueMetricsResponseTasks
} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseTasks';
import {ChartHoverModeEnum} from '@common/experiments/shared/common-experiments.const';
import {ReportsApiMultiplotsResponse} from '@common/constants';

export type GroupedHyperParams = Record<string, HyperParams>;

export type HyperParams = Record<string, boolean>;

export interface VariantOption {
  name: string;
  value: SelectedMetric;
}

export interface MetricOption {
  metricName: string;
  variants: VariantOption[];
}

export interface IExperimentCompareChartsState {
  metricsMultiScalarsCharts: any;
  metricsHistogramCharts: any;
  multiSingleValues: EventsGetTaskSingleValueMetricsResponseTasks[];
  cachedAxisType: ScalarKeyEnum;
  metricsPlotsCharts: ReportsApiMultiplotsResponse;
  settingsList: Record<string, ExperimentCompareSettings>;
  searchTerm: string;
  showSettingsBar: boolean;
  selectedExperiments: string[];
  globalLegendData: { name: string, tags: string[], systemTags: string[], id: string, project: { id: string } }[];
  // scalarsHoverMode: ChartHoverModeEnum;
}

export interface ExperimentCompareSettings extends Omit<ExperimentSettings, 'id' | 'selectedMetric'> {
  id: Task['id'][];
  selectedMetric: SelectedMetricVariant;
  selectedMetrics: SelectedMetricVariant[];
  selectedParamsHoverInfo: string[];
  selectedMetricsHoverInfo: SelectedMetricVariant[];
}

export const initialState: IExperimentCompareChartsState = {
  metricsMultiScalarsCharts: null,
  metricsHistogramCharts: null,
  multiSingleValues: null,
  cachedAxisType: null,
  metricsPlotsCharts: null,
  settingsList: {},  // TODO, Make this an object with ID's as key YK
  searchTerm: '',
  showSettingsBar: false,
  selectedExperiments: [], // TODO: Move this to the general compare reducer
  globalLegendData: null,
  // scalarsHoverMode: 'x'
};

export const experimentsCompareChartsReducer = createReducer(
  initialState,
  on(actions.setSelectedExperiments, (state, action) => ({
    ...state,
    selectedExperiments: [...action.selectedExperiments].sort()
  })),
  on(actions.setExperimentMetricsSearchTerm, (state, action): IExperimentCompareChartsState => ({...state, searchTerm: action.searchTerm})),
  on(actions.setExperimentHistogram, (state, action): IExperimentCompareChartsState => ({
    ...state,
    metricsHistogramCharts: action.payload,
    cachedAxisType: action.axisType
  })),
  on(actions.setExperimentMultiScalarSingleValue, (state, action): IExperimentCompareChartsState => ({...state, multiSingleValues: action.tasks})),
  on(actions.setAxisCache, (state, action): IExperimentCompareChartsState => ({
    ...state,
    cachedAxisType: (action as ReturnType<typeof actions.setAxisCache>).axis
  })),
  on(actions.setExperimentPlots, (state, action): IExperimentCompareChartsState => ({...state, metricsPlotsCharts: action.plots})),
  on(actions.setExperimentSettings, (state, action) => {
    const sortedIds = [...(action.id ?? [])].sort();
    const changesWithTimestamp = {
      ...action.changes,
      id: sortedIds,
      lastModified: (new Date()).getTime()
    } as ExperimentCompareSettings;
    const ids = sortedIds.join();
    const discardBefore = new Date();
    discardBefore.setMonth(discardBefore.getMonth() - 2);
    const discardBeforeTime = discardBefore.getTime();

    const experimentExists = state.settingsList[ids];
    const filteredOldSettings = Object.entries(state.settingsList)
      .filter(([, setting]) => experimentExists || setting.lastModified >= discardBeforeTime)
      .reduce((acc, [id, setting]) => {
        acc[id] = setting;
        return acc;
      }, {} as Record<string, ExperimentCompareSettings>);

    const newSettingsList: Record<string, ExperimentCompareSettings> = {
      ...filteredOldSettings,
      [ids]: {
        ...(state.settingsList[ids] || {}), // Base with old properties (if any)
        ...changesWithTimestamp, // Apply new changes and overwrite id/lastModified
      },
    };

    return {...state, settingsList: newSettingsList};
  }),
  on(actions.resetExperimentMetrics, (state): IExperimentCompareChartsState => ({
    ...state,
    metricsMultiScalarsCharts: initialState.metricsMultiScalarsCharts,
    metricsHistogramCharts: initialState.metricsHistogramCharts,
    metricsPlotsCharts: initialState.metricsPlotsCharts,
    cachedAxisType: initialState.cachedAxisType
  })),
  on(actions.setGlobalLegendData, (state, action): IExperimentCompareChartsState => ({
    ...state,
    globalLegendData: action.data
  })),
  // on(actions.setScalarsHoverMode, (state, action): IExperimentCompareChartsState => ({...state, scalarsHoverMode: action.hoverMode})),
);
