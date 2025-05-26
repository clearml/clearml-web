import {createSelector} from '@ngrx/store';
import {ISmCol, TABLE_SORT_ORDER} from '../../shared/ui-components/data/table/table.consts';
import {experimentInfo, experimentOutput, experimentsView, selectExperimentInfoData, selectOutputSettings, selectSelectedExperiment, selectSelectedModelSettings} from '~/features/experiments/reducers';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {EXPERIMENTS_TABLE_COL_FIELDS, experimentSectionsEnum} from '~/features/experiments/shared/experiments.const';
import {ExperimentSettings} from './experiment-output.reducer';
import {get} from 'lodash-es';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {CommonExperimentInfoState} from './common-experiment-info.reducer';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {ParamsItem} from '~/business-logic/model/tasks/paramsItem';
import {selectRouterConfig, selectRouterParams} from '../../core/reducers/router-reducer';
import {experimentsViewInitialState} from '@common/experiments/reducers/experiments-view.reducer';
import {selectCompareAddTableFilters, selectCompareAddTableSortFields, selectIsCompare, selectIsModels} from '../../experiments-compare/reducers';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {SortMeta} from 'primeng/api';
import {EventsGetTaskSingleValueMetricsResponseValues} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseValues';
import {selectModelExperimentsTableFilters} from '@common/models/reducers';
import {smoothTypeEnum, SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {EXPERIMENT_COMMENT} from '@common/experiments/dumb/experiment-details/experiment-details.component';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {createMetricColumn} from '@common/shared/utils/tableParamEncode';
import {selectIsDeepMode, selectSelectedProjectId} from '@common/core/reducers/projects.reducer';
import {Task} from '~/business-logic/model/tasks/task';

export const selectExperimentsList = createSelector(experimentsView, state => state.experiments);
export const selectTableRefreshList = createSelector(experimentsView, state => !!state.refreshList);
export const selectSelectedTableExperiment = createSelector(experimentsView, state => state.selectedExperiment);

export const selectExperimentsTableColsWidth = createSelector(experimentsView, selectRouterParams,
  (state, params) => state.projectColumnsWidth?.[params?.projectId] ?? {});
export const selectExperimentsHiddenTableCols = createSelector(experimentsView, selectRouterParams,
  (state, params) => state.hiddenProjectTableCols?.[params?.projectId] ?? experimentsViewInitialState.hiddenTableCols);
export const selectMetricVariants = createSelector(experimentsView, state => state.metricVariants);
export const selectMetricVariantsPlots = createSelector(experimentsView, state => state.metricVariantsPlots);
export const selectExperimentViewMode = createSelector(selectRouterConfig,
  config => config.at(-2) === 'compare' ? 'compare' : config.includes(':experimentId') ? 'info' : 'table');
export const selectTableCompareView = createSelector(experimentsView, state => state.tableCompareView);
export const selectMetricVariantForView = createSelector(selectExperimentViewMode, selectTableCompareView, selectMetricVariants, selectMetricVariantsPlots,
  (viewMode, compareView, scalarVars, plotVars) => viewMode === 'compare' && compareView === 'plots' ? plotVars : scalarVars);
export const selectCompareSelectedMetricsScalars = createSelector(experimentsView, selectRouterParams, (state, params) => state.compareSelectedMetrics?.[params?.projectId]);
export const selectCompareSelectedMetricsPlots = createSelector(experimentsView, selectRouterParams, (state, params) => state.compareSelectedMetricsPlots?.[params?.projectId]);
export const selectCompareSelectedMetrics = (viewMode: 'scalars' | 'plots') => createSelector(selectMetricVariants,
  selectMetricVariantsPlots, selectCompareSelectedMetricsScalars, selectCompareSelectedMetricsPlots,
  (metricVariantsScalars, metricVariantsPlots, selectedMetricsScalars, selectedMetricsPlots): ISmCol[] => {
    const selectedMetricsState = viewMode === 'scalars' ? selectedMetricsScalars : selectedMetricsPlots;
    const metricVariants = viewMode === 'scalars' ? metricVariantsScalars : metricVariantsPlots;
    const selectedMetrics = selectedMetricsState?.metrics.map(selectedMetric => {
      const metricVariant = metricVariants?.find(metric => selectedMetric.id === `last_metrics.${metric.metric_hash}.${metric.variant_hash}.value`);
      return metricVariant ? {...metricVariant, ...selectedMetric} : null;
    }).filter(a => !!a);
    return selectedMetrics?.map(selectedMetric => ({
      ...createMetricColumn({
        metric: selectedMetric.metric,
        variant: selectedMetric.variant,
        metricHash: selectedMetric.metric_hash,
        variantHash: selectedMetric.variant_hash,
        valueType: null
      }, null) as ISmCol, hidden: selectedMetric.hidden
    }));
  });
export const selectRawExperimentsTableCols = createSelector(experimentsView, (state) => state.tableCols);
export const selectExperimentsTableCols = createSelector(selectRawExperimentsTableCols, selectExperimentsHiddenTableCols, selectExperimentsTableColsWidth,
  (cols, hidden, colWidth) =>
    cols?.map(col => ({
      ...col,
      hidden: !!hidden[col.id],
      style: {...col.style, ...(col.id !== EXPERIMENTS_TABLE_COL_FIELDS.SELECTED && colWidth[col.id] && {width: `${colWidth[col.id]}px`})}
    } as ISmCol)));
export const selectExperimentsTags = createSelector(experimentsView, (state) => state.projectTags);
export const selectExperimentsParents = createSelector(experimentsView, (state) => state.parents);
export const selectActiveParentsFilter = createSelector(experimentsView, (state) => state.activeParentsFilter);
export const selectExperimentsTypes = createSelector(experimentsView, (state) => state.types);

export const selectExperimentsTableColsOrder = createSelector(experimentsView, selectRouterParams, (state, params): string[] =>
  (state.colsOrder && params?.projectId) ? state.colsOrder[params?.projectId] : undefined);
export const selectExperimentsMetricsCols = createSelector(experimentsView, (state) => state.metricsCols);
export const selectExperimentsMetricsColsForProject = createSelector(experimentsView, selectRouterParams, selectExperimentsHiddenTableCols, selectExperimentsTableColsWidth, (state, params, hidden, colWidth) =>
  state.metricsCols
    .filter(metricCol => metricCol.projectId === params?.projectId)
    .map(col => ({
      ...col,
      hidden: !!hidden[col.id],
      style: {...col.style, ...(colWidth[col.id] && {width: `${colWidth[col.id]}px`})}
    } as ISmCol))
);
export const selectCustomColumns = createSelector(selectSelectedProjectId, selectExperimentsMetricsCols, selectExperimentsHiddenTableCols, selectExperimentsTableColsWidth,
  (projectId, custom, hidden, colWidth) => custom
    .filter(metricCol => metricCol.projectId === projectId)
    .map(col => ({
      ...col,
      hidden: !!hidden[col.id],
      style: {...col.style, ...(colWidth[col.id] && {width: `${colWidth[col.id]}px`})}
    } as ISmCol))
);

export const selectFilteredTableCols = createSelector(selectExperimentsTableCols, selectCustomColumns, selectSelectedProjectId, selectIsDeepMode, (tableCols, metaCols, projectId, deep) =>
  (deep || projectId === '*' ? tableCols : tableCols.filter(col => (col.id !== EXPERIMENTS_TABLE_COL_FIELDS.PROJECT)))
    .concat(metaCols.map(col => ({...col, meta: true})))
);
export const selectHyperParamsFiltersPage = createSelector(experimentsView, state => state.hyperParamsFiltersPage);
export const selectCurrentScrollId = createSelector(experimentsView, (state): string => state.scrollId);
export const selectSplitSize = createSelector(experimentsView, (state): number => state.splitSize);
export const selectGlobalFilter = createSelector(experimentsView, (state) => state.globalFilter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const selectInitTableOrders = createSelector(experimentsView, (state): SortMeta[] => ([{
  field: EXPERIMENTS_TABLE_COL_FIELDS.LAST_UPDATE,
  order: TABLE_SORT_ORDER.DESC
}]));
export const selectTableSortFields = createSelector(
  experimentsView, selectRouterParams, selectIsCompare, selectCompareAddTableSortFields, selectInitTableOrders,
  (state, params, isCompare, compareSortFields, initTableOrders): SortMeta[] =>
    (isCompare ? compareSortFields : (state.projectColumnsSortOrder?.[params?.projectId])) ?? initTableOrders
);
export const selectTableFilters = createSelector(
  experimentsView, selectRouterParams, selectIsCompare, selectCompareAddTableFilters, selectIsModels, selectModelExperimentsTableFilters,
  (state, params, isCompare, compareFilters, isModels, modelExperimentsFilters) =>
    isModels ? modelExperimentsFilters : isCompare ? compareFilters : state.projectColumnFilters?.[params?.projectId] ?? {} as Record<string, FilterMetadata>);
export const selectExperimentsTableFilters = createSelector(experimentsView, selectRouterParams, (state, params) => state.projectColumnFilters?.[params?.projectId] ?? {} as Record<string, FilterMetadata>);

export const selectSelectedExperiments = createSelector(experimentsView, state => state.selectedExperiments);
export const selectSelectedExperimentsDisableAvailable = createSelector(experimentsView, (state) => state.selectedExperimentsDisableAvailable);
export const selectShowAllSelectedIsActive = createSelector(experimentsView, (state): boolean => state.showAllSelectedIsActive);
export const selectNoMoreExperiments = createSelector(experimentsView, (state): boolean => state.noMoreExperiment);
export const selectTableMode = createSelector(experimentsView, state => state.tableMode);
export const selectTableCompareUrlParts = createSelector(
  selectTableCompareView, selectSelectedExperiments, selectExperimentsList, selectRouterConfig,
  (view, selected, experiments, routeConfig) => ({
    view, selected: (selected.map(e => e.id)), experiments: experiments.map(e => e.id), routeConfig
  }));
export const selectShowCompareScalarSettings = createSelector(experimentsView, state => state.showCompareScalarSettings);
export const selectCloneForceParent = createSelector(experimentsView, state => state.cloneForceParent);
export const selectExperimentInfoDataFreeze = createSelector(experimentInfo, (state): IExperimentInfo => state.infoDataFreeze);
export const selectExperimentInfoErrors = createSelector(experimentInfo, (state): CommonExperimentInfoState['errors'] => state.errors);

export const selectSelectedFromTable = createSelector(selectSelectedTableExperiment, selectSelectedExperiment, selectExperimentsList,
  (selectedFromTable, selectedFromInfo, experiments) => {
    const selectedId = selectedFromTable?.id ?? selectedFromInfo?.id;
    return experiments?.find(exp => exp.id === selectedId) ?? null;
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const selectIsSelectedExperimentInDev = createSelector(experimentInfo, info => false);
export const selectIsExperimentSaving = createSelector(experimentInfo, (state): boolean => state.saving);
export const selectIsExperimentInEditMode = createSelector(experimentInfo, (state): boolean => state.activeSectionEdit);
export const selectCurrentActiveSectionEdit = createSelector(experimentInfo, (state): string => state.currentActiveSectionEdit);

export const selectExperimentLog = createSelector(experimentOutput, state => state.experimentLog);
export const selectExperimentBeginningOfLog = createSelector(experimentOutput, (state) => state.beginningOfLog);
export const selectExperimentInfoPlots = createSelector(experimentOutput, (state) => state.metricsPlotsCharts);
export const selectExperimentHistogramCacheAxisType = createSelector(experimentOutput, (state) => state.cachedAxisType);
export const selectExperimentMetricsSearchTerm = createSelector(experimentOutput, (state) => state.searchTerm);
export const selectGraphsPerRow = createSelector(experimentOutput, state => state.graphsPerRow);
export const selectHyperParamsVariants = createSelector(experimentsView, state => state.hyperParams);
export const selectHyperParamsOptions = createSelector(experimentsView, (state): Record<ISmCol['id'], string[]> => state.hyperParamsOptions);
export const selectPipelineSelectedStep = createSelector(experimentInfo, state => state.selectedPipelineStep);
export const selectExperimentDownloadingOperationLog = createSelector(experimentInfo, state => state.downloadingExperimentOperationLog);
export const selectPipelineSelectedStepWithFallback = createSelector(selectSelectedExperiment, selectPipelineSelectedStep,
  (selectedController, selectedStep) => ((selectedStep as any)?.data?.isStage ? selectedController : selectedStep) ?? selectedController);

export const selectStartPipelineDialogTask = createSelector(experimentInfo, state => state.pipelineRunDialogTask);

export const selectExperimentUserKnowledge = createSelector(experimentInfo,
  (state): Map<experimentSectionsEnum, boolean> => state.userKnowledge);

export const selectLogFilter = createSelector(experimentOutput, (state) => state.logFilter);
export const selectLogLoading = createSelector(experimentOutput, (state) => state.logLoading);

export const selectTotalLogLines = createSelector(experimentOutput, (state) => state.totalLogLines);

export const selectShowSettings = createSelector(experimentOutput, (state) => state.showSettings);
export const selectMetricValuesView = createSelector(experimentOutput, (state) => state.metricValuesView);
export const selectSelectedExperimentSettings = (cardProjectId?: string) => createSelector(selectOutputSettings, selectSelectedExperiment, selectSelectedProjectId,
  (settingsList, currentExperiment, projectId): Partial<ExperimentSettings> => {
    if (currentExperiment) {
      return settingsList?.find((setting) => setting.id === currentExperiment.id) ?? settingsList?.find((setting) => setting.id === (currentExperiment.project?.id ?? projectId)) ?? {};
    } else {
      return settingsList?.find((setting) => setting.id === cardProjectId) || {};
    }
  });

export const selectSelectedSettingsHiddenPlot = createSelector(selectSelectedExperimentSettings(),
  settings => settings?.hiddenMetricsPlot ?? []);
export const selectSelectedSettingsHiddenScalar = (cardProjectId?: string) =>createSelector(selectSelectedExperimentSettings(cardProjectId),
  settings => settings?.hiddenMetricsScalar ?? []);
export const selectSelectedSettingsTableMetric = createSelector(selectSelectedExperimentSettings(),
  settings => settings?.selectedMetricTable ?? null);
export const selectSelectedSettingsModelTableMetric = createSelector(selectSelectedModelSettings,
  settings => settings?.selectedMetricTable ?? null);
export const selectSelectedSettingsSmoothWeight = createSelector(selectSelectedExperimentSettings(),
  settings => settings?.smoothWeight === undefined ? 0 : settings.smoothWeight);
export const selectSelectedSettingsSmoothSigma = createSelector(selectSelectedExperimentSettings(),
  settings => settings?.smoothSigma === undefined ? 2 : settings.smoothSigma);
export const selectSelectedSettingsSmoothType = createSelector(selectSelectedExperimentSettings(),
  (settings): SmoothTypeEnum => settings?.smoothType ?? smoothTypeEnum.exponential);
export const selectSelectedSettingsxAxisType = (isModel: boolean) => createSelector(selectSelectedExperimentSettings(), selectSelectedModelSettings,
  (settings, modelSettings) => {
    const theSettings = isModel ? modelSettings : settings;
    return theSettings?.xAxisType ?? ScalarKeyEnum.Iter as ScalarKeyEnum;
  });
export const selectSelectedSettingsIsProjectLevel = createSelector(selectSelectedExperimentSettings(),
  (settings): boolean => Object.keys(settings).length === 0  || settings?.projectLevel);

export const selectSelectedSettingsGroupBy = createSelector(selectSelectedExperimentSettings(),
  settings => settings?.groupBy ?? 'metric');
export const selectIsExperimentInProgress = createSelector(selectSelectedExperiment,
  experiment => experiment && (experiment.status === TaskStatusEnum.InProgress));

export const selectExperimentModelInfoData = createSelector(selectExperimentInfoData, info => info?.model);

export const selectExperimentExecutionInfoData = createSelector(selectExperimentInfoData, info => info?.execution);

export const selectExperimentHyperParamsInfoData = createSelector(selectExperimentInfoData, info => info?.hyperparams);

export const selectExperimentConfiguration = createSelector(selectExperimentInfoData,
  (info: IExperimentInfo): IExperimentInfo['configuration'] => info?.configuration);

export const selectExperimentHyperParamsSelectedSectionFromRoute = createSelector(selectRouterParams,
  (params): string => params?.hyperParamId && decodeURIComponent(params?.hyperParamId));


export const selectExperimentSelectedConfigObjectFromRoute = createSelector(selectRouterParams,
  (params): string => params?.configObject && decodeURIComponent(params?.configObject));


export const selectSelectedExperimentFromRouter = createSelector(selectRouterParams,
  (params): string => params?.experimentId);

export const selectExperimentConfigObj =
  createSelector(selectExperimentConfiguration, selectExperimentSelectedConfigObjectFromRoute,
    (configuration: IExperimentInfo['configuration'], configObj: string) => get(configuration, configObj, null));


export const selectExperimentHyperParamsSelectedSectionParams =
  createSelector(selectExperimentHyperParamsInfoData, selectExperimentHyperParamsSelectedSectionFromRoute,
    (hyperparams: IExperimentInfo['hyperparams'], section: string): ParamsItem[] => Object.entries(get(hyperparams, section, {})).map(([, value]) => value));
export const selectScalarSingleValue = createSelector(experimentOutput, (state): EventsGetTaskSingleValueMetricsResponseValues[] => state.scalarSingleValue);
export const selectHasScalarSingleValue = createSelector(selectScalarSingleValue, (scalarSingleValue): boolean => scalarSingleValue?.length > 0);
export const selectLastMetricsValues = createSelector(experimentOutput, (state): Task['last_metrics'] => state.lastMetrics);


const selectMetricHistogram = createSelector(experimentOutput, state => state.metricsHistogramCharts);

const createHistogramSelector = (selectAxisType) =>
  createSelector(
    selectAxisType,
    selectMetricHistogram,
    (axisType, chart) => {
      if (axisType === ScalarKeyEnum.IsoTime && chart) {
        return Object.keys(chart).reduce((groupAcc, groupName) => {
          const group = chart[groupName];
          groupAcc[groupName] = Object.keys(group).reduce((graphAcc, graphName) => {
            const graph = group[graphName];
            graphAcc[graphName] = {...graph, x: graph.x.map(ts => new Date(ts))};
            return graphAcc;
          }, {});
          return groupAcc;
        }, {});
      }
      return chart;
    });

export const selectExperimentInfoHistograms = createHistogramSelector(selectSelectedSettingsxAxisType(false));

export const selectArtifactId = createSelector(selectRouterParams,
  params => decodeURIComponent(params?.artifactId || params?.modelId)
);
export const selectCurrentArtifactExperimentId = createSelector(experimentInfo, state => state.artifactsExperimentId);
export const selectDownloadingArtifact = createSelector(experimentInfo, state => state.downloading);

export const selectModelSettingsXAxisType = createSelector(selectSelectedModelSettings,
  settings => settings?.xAxisType ?? ScalarKeyEnum.Iter as ScalarKeyEnum);
// export const selectModelInfoHistograms = createHistogramSelector(selectModelSettingsXAxisType);
export const selectModelInfoHistograms = createHistogramSelector(selectSelectedSettingsxAxisType(true));
export const selectModelSettingsGroupBy = createSelector(selectSelectedModelSettings,
  settings => settings?.groupBy ?? 'metric');
export const selectModelSettingsSmoothWeight = createSelector(selectSelectedModelSettings,
  settings => settings?.smoothWeight ?? 0);
export const selectModelSettingsSmoothSigma = createSelector(selectSelectedModelSettings,
  settings => settings?.smoothSigma ?? 2);
export const selectModelSettingsSmoothType = createSelector(selectSelectedModelSettings,
  settings => settings?.smoothType ?? smoothTypeEnum.exponential);
export const selectModelSettingsHiddenScalar = createSelector(selectSelectedModelSettings,
  settings => settings?.hiddenMetricsScalar ?? []);
export const selectModelSettingsHiddenPlot = createSelector(selectSelectedModelSettings,
  settings => settings?.hiddenMetricsPlot ?? []);
export const selectEditingDescription = createSelector(selectCurrentActiveSectionEdit, section => section === EXPERIMENT_COMMENT);

export const selectSelectedExperimentReadOnly = createSelector(selectSelectedExperiment, experiment => isReadOnly(experiment));

export const selectSelectedModelSettingsIsProjectLevel = createSelector(selectSelectedModelSettings,
  (settings): boolean => Object.keys(settings || {}).length === 0  || settings?.projectLevel);
