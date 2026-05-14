import {ActionReducerMap, createSelector} from '@ngrx/store';
import {ExperimentCompareDetailsState, experimentsCompareDetailsReducer} from './experiments-compare-details.reducer';
import {ExperimentCompareSettings, experimentsCompareChartsReducer, GroupedHyperParams, IExperimentCompareChartsState, MetricOption} from './experiments-compare-charts.reducer';
import {experimentsCompareMetricsValuesReducer, IExperimentCompareMetricsValuesState} from './experiments-compare-metrics-values.reducer';
import {compareHeader, CompareHeaderState} from './compare-header.reducer';
import {IExperimentDetail} from '~/features/experiments-compare/experiments-compare-models';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {scalarsGraphReducer, ScalarsGraphState} from './experiments-compare-scalars-graph.reducer';
import {ExperimentParams, ModelDetail} from '../shared/experiments-compare-details.model';
import {CompareParamsState, experimentsCompareParamsReducer} from './experiments-compare-params.reducer';
import {selectRouterConfig, selectRouterParams} from '../../core/reducers/router-reducer';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';

export const experimentsCompareReducers: ActionReducerMap<{
  details: ExperimentCompareDetailsState;
  params: CompareParamsState;
  metricsValues: IExperimentCompareMetricsValuesState;
  charts: IExperimentCompareChartsState ;
  compareHeader: CompareHeaderState;
  scalarsGraph: ScalarsGraphState;
}> = {
  details: experimentsCompareDetailsReducer,
  params: experimentsCompareParamsReducer,
  metricsValues: experimentsCompareMetricsValuesReducer,
  charts: experimentsCompareChartsReducer,
  compareHeader,
  scalarsGraph: scalarsGraphReducer
};

export const selectCompareIdsFromRoute = createSelector(selectRouterParams, params => params.ids);
export const experimentsCompare = state => state.experimentsCompare;

// Details
export const selectExperimentsDetailsSection = createSelector(experimentsCompare, (state): ExperimentCompareDetailsState => state.details ?? {});
export const selectExperimentsDetails = createSelector(selectExperimentsDetailsSection, (state): IExperimentDetail[] => state.experiments);
export const selectModelsDetails = createSelector(selectExperimentsDetailsSection, (state): ModelDetail[] => state.models);
export const selectExperimentIdsDetails = createSelector(selectExperimentsDetails,
  (experiments): IExperimentDetail['id'][] => experiments.map(exp => exp.id));
export const selectModelIdsDetails = createSelector(selectModelsDetails,
  (models): ModelDetail['id'][] => models.map(model => model.id));

// Params
export const selectExperimentsParamsSection = createSelector(experimentsCompare, (state): CompareParamsState => state.params ?? {});
export const selectExperimentsParams = createSelector(selectExperimentsParamsSection, (state): ExperimentParams[] => state.experiments);
export const selectExperimentIdsParams = createSelector(selectExperimentsParams,
  (experiments): IExperimentDetail['id'][] => experiments.map(exp => exp.id));


// select experiments for compare and header
export const selectCompareHeader = createSelector(experimentsCompare, state => (state?.compareHeader ?? {}) as CompareHeaderState);
export const selectIsCompare = createSelector(selectRouterConfig, (config): boolean => config?.includes('compare-tasks'));
export const selectIsModels = createSelector(selectRouterConfig, (config): boolean => config?.includes('models'));
export const selectIsPipelines = createSelector(selectRouterConfig, (config): boolean => config?.[0] === 'pipelines');
export const selectIsDatasets = createSelector(selectRouterConfig, (config): boolean => config?.[0] === 'datasets');
export const selectHideIdenticalFields = createSelector(selectCompareHeader, state => state?.hideIdenticalRows);
export const selectShowRowExtremes = createSelector(selectCompareHeader, state => state?.showRowExtremes);
export const selectShowGlobalLegend = createSelector(selectCompareHeader, state => state?.showGlobalLegend);
export const selectExperimentsUpdateTime = createSelector(selectCompareHeader, state => state ? state.experimentsUpdateTime : {});
export const selectExportTable = createSelector(selectCompareHeader, state => state?.exportTable);

// Metric Values
export const selectCompareMetricsValues = createSelector(experimentsCompare, (state): IExperimentCompareMetricsValuesState => state.metricsValues ?? {});
export const selectCompareMetricsValuesExperiments = createSelector(selectCompareMetricsValues, state => state.experiments);

// Charts
export const selectCompareCharts = createSelector(experimentsCompare, (state): IExperimentCompareChartsState => state.charts ?? {});
export const selectSelectedExperiments = createSelector(selectCompareCharts, (state): string[] => state ? state.selectedExperiments : []);
export const selectGlobalLegendData = createSelector(selectCompareCharts, state => state.globalLegendData);
export const selectHighlightedTaskId = createSelector(selectCompareCharts, state => state?.highlightedTaskId ?? null);
export const selectCompareHistogramCacheAxisType = createSelector(selectCompareCharts, state => state.cachedAxisType);
export const selectCompareTasksPlotCharts = createSelector(selectCompareCharts, state => state.metricsPlotsCharts);
export const selectMultiSingleValues = createSelector(selectCompareCharts, state => state.multiSingleValues);

// export const selectScalarsHoverMode = createSelector(compareCharts, (state): ChartHoverModeEnum => state.scalarsHoverMode);

export const selectSelectedExperimentSettings = createSelector(selectCompareCharts, selectSelectedExperiments,
  (output, currentExperiments): ExperimentCompareSettings => output.settingsList?.[currentExperiments?.join()]);

export const selectSelectedSettingsHyperParams = createSelector(selectSelectedExperimentSettings,
  (settings): string[] => settings?.selectedHyperParams);

export const selectSelectedSettingsMetric = createSelector(selectSelectedExperimentSettings,
  (settings) => settings?.selectedMetric || null);

export const selectSelectedSettingsMetrics = createSelector(selectSelectedExperimentSettings,
  (settings) => settings?.selectedMetrics || null);

export const selectSelectedSettingsHyperParamsHoverInfo = createSelector(selectSelectedExperimentSettings,
  (settings): string[] => settings?.selectedParamsHoverInfo || []);

export const selectSelectedSettingsMetricsHoverInfo = createSelector(selectSelectedExperimentSettings,
  (settings) => settings?.selectedMetricsHoverInfo || null);

export const selectSelectedMetricsSettingsPlot = createSelector(selectSelectedExperimentSettings,
  (settings): string[] => settings?.selectedMetricsPlot);

export const selectExperimentMetricsSearchTerm = createSelector(selectCompareCharts, (state) => state.searchTerm);

export const selectViewMode = (page: string) => createSelector(selectExperimentsParamsSection , state => state.viewMode[page]);

export const selectScalarsGraph = createSelector(experimentsCompare, (state): ScalarsGraphState => state?.scalarsGraph ?? {});
export const selectScalarsGraphMetrics = createSelector(selectScalarsGraph, (state): MetricOption[] => state.metrics);
export const selectScalarsGraphMetricsResults = createSelector(selectScalarsGraph, (state): MetricVariantResult[] => state.metricVariantsResults);
export const selectScalarsGraphHyperParams = createSelector(selectScalarsGraph, (state): GroupedHyperParams => state ? state.hyperParams : {});
export const selectScalarsGraphTasks = createSelector(selectScalarsGraph, (state) => state ? state.tasks : []);
export const selectScalarsParamsHoverInfo = createSelector(selectScalarsGraph, (state) => state.paramsHoverInfo ?? []);
export const selectScalarsMetricsHoverInfo = createSelector(selectScalarsGraph, (state): SelectedMetricVariant[] => state ? state.metricsHoverInfo : []);

export const selectCompareTasksScalarCharts = createSelector(
  selectCompareHistogramCacheAxisType,
  selectCompareCharts,
  (axisType, state) => {
    if (state?.metricsHistogramCharts?.metrics && (!axisType || axisType === ScalarKeyEnum.IsoTime)) {
      return {
        metrics: Object.keys(state.metricsHistogramCharts.metrics).reduce((metricAcc, metricName) => {
          const metric = state.metricsHistogramCharts.metrics[metricName];
          metricAcc[metricName] = Object.keys(metric).reduce((groupAcc, groupName) => {
            const group = metric[groupName];
            groupAcc[groupName] = Object.keys(group).reduce((graphAcc, graphName) => {
              const graph = group[graphName];
              graphAcc[graphName] = {...graph, x: graph.x.map(ts => new Date(ts))};
              return graphAcc;
            }, {});
            return groupAcc;
          }, {});
          return metricAcc;
        }, {})
      };
    }
    return state.metricsHistogramCharts;
  });
