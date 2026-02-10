import {ITableExperiment} from '../shared/common-experiment-model.model';
import {ISmCol} from '../../shared/ui-components/data/table/table.consts';
import * as actions from '../actions/common-experiments-view.actions';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {createCompareMetricColumn, decodeURIComponentSafe, TableFilter} from '../../shared/utils/tableParamEncode';
import {ProjectsGetTaskParentsResponseParents} from '~/business-logic/model/projects/projectsGetTaskParentsResponseParents';
import {SearchState} from '../../common-search/common-search.reducer';
import {SortMeta} from 'primeng/api';
import {CountAvailableAndIsDisableSelectedFiltered} from '../../shared/entity-page/items.utils';
import {setSelectedProject} from '@common/core/actions/projects.actions';
import {createReducer, on} from '@ngrx/store';
import {FilterMetadata} from 'primeng/api';
import {IExperimentInfo, ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {EventTypeEnum} from '~/business-logic/model/events/eventTypeEnum';
import {cloneExperiment, removeTagSuccess} from '@common/experiments/actions/common-experiments-menu.actions';
import {HIDDEN_PLOTS_BY_DEFAULT} from '@common/experiments-compare/experiments-compare.constants';
import {camelCase, isEqual} from 'lodash-es';
import {INITIAL_EXPERIMENT_COLS_ORDER, INITIAL_EXPERIMENT_TABLE_COLS} from '@common/experiments/experiment.consts';
import {cloneExtraToggles} from '~/shared/constants/non-common-consts';


export interface ExperimentsViewState {
  tableCols: ISmCol[];
  colsOrder: Record<string, string[]>;
  tableFilters: any;
  tempFilters: Record<string, FilterMetadata>;
  projectColumnFilters: Record<string, Record<string, FilterMetadata>>;
  projectColumnsSortOrder: Record<string, SortMeta[]>;
  projectColumnsWidth: Record<string, Record<string, number>>;
  metricsCols: Record<string, ISmCol[]>;
  hiddenTableCols: Record<string, boolean>;
  hiddenProjectTableCols: Record<string, Record<string, boolean | undefined>>;
  experiments: ITableExperiment[];
  refreshList: boolean;
  noMoreExperiment: boolean;
  selectedExperiment: IExperimentInfo;
  selectedExperiments: ISelectedExperiment[];
  selectedExperimentsDisableAvailable: Record<string, CountAvailableAndIsDisableSelectedFiltered>;
  selectedExperimentSource: string;
  experimentToken: string;
  scrollId: string;
  hyperParamsFiltersPage: number;
  globalFilter: SearchState['searchQuery'];
  showAllSelectedIsActive: boolean;
  metricVariants: MetricVariantResult[];
  metricVariantsPlots: MetricVariantResult[];
  compareSelectedMetrics: Record<string, { metrics: Partial<ISmCol>[]; lastModified: number }>;
  compareSelectedMetricsPlots: Record<string, { metrics: Partial<ISmCol>[]; lastModified: number }>;
  hyperParams: {name: string; section: string}[];
  hyperParamsOptions: Record<ISmCol['id'], string[]>;
  metricsLoading: boolean;
  projectTags: string[];
  parents: ProjectsGetTaskParentsResponseParents[];
  activeParentsFilter: ProjectsGetTaskParentsResponseParents[];
  types: string[];
  splitSize: number;
  tableMode: 'info' | 'table' | 'compare';
  tableCompareView: 'scalars' | 'plots';
  showCompareScalarSettings: boolean;
  cloneDefaultOptions: Record<string, boolean>;
}

export const experimentsViewInitialState: ExperimentsViewState = {
  tableCols: [],
  colsOrder: {},

  hiddenTableCols: {comment: true, active_duration: true, id: true},
  hiddenProjectTableCols: {},
  experiments: null,
  refreshList: false,
  tableFilters: {},
  tempFilters: {},
  projectColumnFilters: {},
  projectColumnsSortOrder: {},
  projectColumnsWidth: {},
  noMoreExperiment: false,
  selectedExperiment: null,
  selectedExperiments: [],
  selectedExperimentsDisableAvailable: {},
  selectedExperimentSource: null,
  experimentToken: null,
  scrollId: null, // -1 so the "getNextExperiments" will send 0.
  hyperParamsFiltersPage: 0,
  globalFilter: null,
  showAllSelectedIsActive: false,
  metricsCols: {},
  metricVariants: null,
  metricVariantsPlots: null,
  compareSelectedMetrics: {},
  compareSelectedMetricsPlots: {},
  hyperParams: [],
  hyperParamsOptions: {},
  metricsLoading: false,
  projectTags: [],
  parents: null,
  activeParentsFilter: [],
  types: [],
  splitSize: 70,
  tableMode: 'table',
  tableCompareView: 'scalars',
  showCompareScalarSettings: false,
  cloneDefaultOptions: {},
};

const setExperimentsAndUpdateSelectedExperiments = (state: ExperimentsViewState, payload: {
  id: string;
  changes: Partial<ITableExperiment>
}) => ({
  ...state,
  experiments: state.experiments?.map(ex => ex.id === payload.id ? {...ex, ...payload.changes} : ex) || null,
  ...(state.selectedExperiment?.id === payload.id && {selectedExperiment: {...state.selectedExperiment, ...payload.changes}}),
  ...(state.selectedExperiments.find(ex => ex.id === payload.id) && {selectedExperiments: state.selectedExperiments.map(ex => ex.id === payload.id ? {...ex, ...payload.changes} : ex)})
});

export const experimentsViewReducer = createReducer<ExperimentsViewState>(
  experimentsViewInitialState,
  on(actions.setTableCols, (state, action): ExperimentsViewState => ({...state, tableCols: action.cols})),
  on(actions.resetExperiments, (state, action): ExperimentsViewState => ({
    ...state,
    experiments: experimentsViewInitialState.experiments,
    selectedExperiment: experimentsViewInitialState.selectedExperiment,
    metricVariants: experimentsViewInitialState.metricVariants,
    ...(!action.skipResetMetric && {metricVariantsPlots: experimentsViewInitialState.metricVariantsPlots}),
    showAllSelectedIsActive: experimentsViewInitialState.showAllSelectedIsActive,
    // tableMode: experimentsViewInitialState.tableMode
  })),
  on(setSelectedProject, (state): ExperimentsViewState => ({
    ...state,
    selectedExperiments: experimentsViewInitialState.selectedExperiments,
    metricVariants: experimentsViewInitialState.metricVariants,
    metricVariantsPlots: experimentsViewInitialState.metricVariantsPlots,
    hyperParamsOptions: experimentsViewInitialState.hyperParamsOptions
  })),
  on(actions.showOnlySelected, (state, action): ExperimentsViewState => ({
    ...state,
    showAllSelectedIsActive: action.active,
    globalFilter: experimentsViewInitialState.globalFilter,
    tempFilters: state.projectColumnFilters[action.projectId] || {},
    ...(state.showAllSelectedIsActive && {
      projectColumnFilters: {
        ...state.projectColumnFilters,
        [action.projectId]: action.active ? experimentsViewInitialState.tableFilters : state.tempFilters
      }
    })
  })),
  on(actions.addExperiments, (state, action): ExperimentsViewState => ({
    ...state,
    experiments: state.experiments?.concat(action.experiments) || null
  })),
  on(actions.removeExperiments, (state, action): ExperimentsViewState => ({
    ...state,
    experiments: state.experiments?.filter(exp => !action.experiments.includes(exp.id)) || null
  })),
  on(actions.updateExperiment, (state, action): ExperimentsViewState => setExperimentsAndUpdateSelectedExperiments(state, action)),
  on(actions.updateManyExperiment, (state, action): ExperimentsViewState =>
    action.changeList.reduce((acc, change) => {
      acc = setExperimentsAndUpdateSelectedExperiments(acc, {id: change.id, changes: change.fields});
      return acc;
    }, state as ExperimentsViewState)
  ),
  on(actions.setExperiments, (state, action): ExperimentsViewState => ({...state, experiments: action.experiments})),
  on(actions.setTableRefreshPending, (state, action): ExperimentsViewState => ({...state, refreshList: action.refresh})),
  on(actions.setExperimentInPlace, (state, action): ExperimentsViewState => ({
    ...state, experiments: state.experiments
      ?.map(currExp => action.experiments.find(newExp => newExp.id === currExp.id))
      .filter(e => e) || null
  })),
  on(actions.setNoMoreExperiments, (state, action): ExperimentsViewState => ({...state, noMoreExperiment: action.hasMore})),
  on(actions.setCurrentScrollId, (state, action): ExperimentsViewState => ({...state, scrollId: action.scrollId})),
  on(actions.setHyperParamsFiltersPage, (state, action): ExperimentsViewState => ({...state, hyperParamsFiltersPage: action.page})),
  on(actions.setSelectedExperiment, (state, action): ExperimentsViewState => ({...state, selectedExperiment: action.experiment ?? null})),
  on(actions.setSelectedExperiments, (state, action): ExperimentsViewState => ({
    ...state,
    selectedExperiments: action.experiments,
    // ...(state.tableMode === 'compare' && {[state.tableCompareView === 'plots' ? 'metricVariantsPlots': 'metricVariants']:  []}),
  })),
  on(actions.setSelectedExperimentsDisableAvailable, (state, action): ExperimentsViewState =>
    ({...state, selectedExperimentsDisableAvailable: action.selectedExperimentsDisableAvailable})),
  on(actions.globalFilterChanged, (state, action): ExperimentsViewState =>
    ({
      ...state,
      globalFilter: action as ReturnType<typeof actions.globalFilterChanged>,
      showAllSelectedIsActive: false
    })),
  on(actions.resetGlobalFilter, (state): ExperimentsViewState => ({...state, globalFilter: experimentsViewInitialState.globalFilter})),
  on(actions.setTableSort, (state, action): ExperimentsViewState => {
    const colIds = state.tableCols.map(col => col.id).concat(state.metricsCols[action.projectId]?.map(col => col.id) ?? []);
    let orders = action.orders.filter(order => colIds.includes(order.field));
    orders = orders.length > 0 ? orders : null;
    if (!state.projectColumnsSortOrder[action.projectId] && isEqual(orders, INITIAL_EXPERIMENT_COLS_ORDER)) {
      return state;
    }
    return {...state, projectColumnsSortOrder: {...state.projectColumnsSortOrder, [action.projectId]: orders}};
  }),
  on(actions.resetSortOrder, (state, action): ExperimentsViewState => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {[action.projectId]: remove, ...order} = state.projectColumnsSortOrder;
    return {...state, projectColumnsSortOrder: order};
  }),
  on(actions.setColumnWidth, (state, action): ExperimentsViewState => ({
    ...state,
    projectColumnsWidth: {
      ...state.projectColumnsWidth,
      [action.projectId]: {
        ...state.projectColumnsWidth[action.projectId],
        [action.columnId]: action.widthPx
      }
    }
  })),
  on(actions.toggleColHidden, (state, action): ExperimentsViewState => {
    let newHiddenCols = {...(state.hiddenProjectTableCols[action.projectId] || experimentsViewInitialState.hiddenTableCols)};
      newHiddenCols = {...newHiddenCols, [action.columnId]: !newHiddenCols?.[action.columnId]};

    if (!state.hiddenProjectTableCols[action.projectId] && isEqual(newHiddenCols, experimentsViewInitialState.hiddenProjectTableCols)) {
      return state;
    }
    return {
      ...state,
      hiddenProjectTableCols: {
        ...state.hiddenProjectTableCols,
        [action.projectId]: newHiddenCols
      }
    }
  }),
  on(actions.toggleSelectedMetricCompare, (state, action): ExperimentsViewState => {
    const selectedMetricsKey = state.tableCompareView === 'scalars' ? 'compareSelectedMetrics' : 'compareSelectedMetricsPlots';
    return {
      ...state,
      [selectedMetricsKey]: {
        ...state[selectedMetricsKey],
        [action.projectId]: {
          lastModified: state[selectedMetricsKey]?.[action.projectId].lastModified,
          metrics: state[selectedMetricsKey]?.[action.projectId].metrics.map(metric => metric.id === action.columnId ? {...metric, hidden: !metric.hidden} : metric)
        }
      }
    }
  }),
  on(actions.setVisibleColumnsForProject, (state, action): ExperimentsViewState => {
    const visibleColumns = ['selected'].concat(action['visibleColumns']) as string[];
    const newHiddenColumns = {
      ...state.hiddenProjectTableCols[action.projectId],
      ...state.tableCols
        .filter(col => !visibleColumns.includes(col.id))
        .reduce((obj, col) => ({...obj, [col.id]: true}), {})
    }
    if (!state.hiddenProjectTableCols[action.projectId] && isEqual(newHiddenColumns, experimentsViewInitialState.hiddenTableCols)) {
      return state;
    }
    return {
      ...state,
      hiddenProjectTableCols: {
        ...state.hiddenProjectTableCols,
        [action.projectId]: newHiddenColumns
      }
    };

  }),
  on(actions.setTableFilters, (state, action): ExperimentsViewState => {
    const newFilters = action.filters.reduce((obj, filter: TableFilter) => {
      obj[filter.col] = {
        value: filter.value,
        ...(filter.filterMatchMode && {matchMode: filter.filterMatchMode})
      };
      return obj;
    }, {} as Record<string, { value: string; matchMode: string }>);

    if (!state.projectColumnFilters[action.projectId] && isEqual(newFilters, experimentsViewInitialState.projectColumnFilters)) {
      return state;
    }
    return {
      ...state,
      projectColumnFilters: {
        ...state.projectColumnFilters,
        [action.projectId]: {...newFilters}
      }
    }
  }),
  on(actions.setExtraColumns, (state, action): ExperimentsViewState =>{
    if (!state.metricsCols[action.projectId] && action.columns.length === 0) {
      return state;
    }
    return {
      ...state,
      metricsCols: {
        ...state.metricsCols,
        [action.projectId]: action.columns
      }
    }
  }),
  on(actions.addColumn, (state, action): ExperimentsViewState => {
    const hiddenColumns = {...state.hiddenProjectTableCols[action.col.projectId]};
    delete hiddenColumns[action.col.id];
    return {
      ...state,
      metricsCols: {
        ...state.metricsCols,
        [action.col.projectId]: [...(state.metricsCols[action.col.projectId] ?? []), action.col]
      },
      hiddenProjectTableCols: {
        ...state.hiddenProjectTableCols,
        [action.col.projectId]: hiddenColumns
      }
    }}),
  on(actions.addSelectedMetric, (state, action): ExperimentsViewState => {
    const selectedMetricsKey = state.tableCompareView === 'scalars' ? 'compareSelectedMetrics' : 'compareSelectedMetricsPlots';
    return {
      ...state,
      [selectedMetricsKey]: {
        ...state[selectedMetricsKey],
        [action.projectId]: {
          lastModified: (new Date()).getTime(),
          metrics: state[selectedMetricsKey][action.projectId].metrics.find(m => m.id === action.col.id) ? state[selectedMetricsKey][action.projectId].metrics : [...state[selectedMetricsKey][action.projectId].metrics, action.col]
        }
      }
    }
  }),
  on(actions.removeCol, (state, action): ExperimentsViewState => {
    const columnId = decodeURIComponentSafe(action.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {[columnId]: removedCol, ...remainingColsWidth} = state.projectColumnsWidth[action.projectId] || {};
    return {
      ...state,
      metricsCols: {
        ...state.metricsCols,
        [action.projectId]: state.metricsCols[action.projectId]?.filter(tableCol => !(tableCol.id === columnId))
      },
      projectColumnsSortOrder: {
        ...state.projectColumnsSortOrder,
        [action.projectId]: state.projectColumnsSortOrder[action.projectId]?.filter(order => order.field !== columnId)
      },
      projectColumnsWidth: {
        ...state.projectColumnsWidth,
        [action.projectId]: Object.keys(remainingColsWidth).length > 0 ? remainingColsWidth : undefined
      },
      colsOrder: {
        ...state.colsOrder,
        [action.projectId]: state.colsOrder[action.projectId]?.filter(colId => colId !== columnId)
      }
    };
  }),
  on(actions.removeSelectedMetric, (state, action): ExperimentsViewState => {
    const selectedMetricsKey = state.tableCompareView === 'scalars' ? 'compareSelectedMetrics' : 'compareSelectedMetricsPlots';
    return {
      ...state,
      [selectedMetricsKey]: {
        ...state[selectedMetricsKey],
        [action.projectId]: {
          lastModified: (new Date()).getTime(),
          metrics: [...state[selectedMetricsKey][action.projectId].metrics.filter(tableCol => !(tableCol.id === action.id))]
        }
      }
    };
  }),
  on(actions.setTags, (state, action): ExperimentsViewState => ({...state, projectTags: action.tags})),
  on(actions.addProjectsTag, (state, action): ExperimentsViewState => ({...state, projectTags: Array.from(new Set(state.projectTags.concat(action.tag))).sort()})),
  on(actions.setParents, (state, action): ExperimentsViewState => ({...state, parents: action.parents})),
  on(actions.resetTablesFilterParentsOptions, (state): ExperimentsViewState => ({...state, parents: null})),
  on(actions.setActiveParentsFilter, (state, action): ExperimentsViewState => ({...state, activeParentsFilter: action.parents})),
  on(actions.setProjectsTypes, (state, action): ExperimentsViewState => ({...state, types: action.types})),
  on(actions.clearHyperParamsCols, (state, action): ExperimentsViewState => ({
    ...state,
    metricsCols: {
      ...state.metricsCols,
      [action.projectId]: state.metricsCols[action.projectId]?.filter(tableCol => !(tableCol.id.startsWith('hyperparams')))
    },
    projectColumnsSortOrder: {
      ...state.projectColumnsSortOrder,
      [action.projectId]: state.projectColumnsSortOrder[action.projectId]?.filter(order => order.field.startsWith('hyperparams'))
    }
  })),
  on(actions.setCustomMetrics, (state, action): ExperimentsViewState => {
    const selectedMetricsKey = action.compareView === EventTypeEnum.TrainingStatsScalar ? 'compareSelectedMetrics' : 'compareSelectedMetricsPlots';
    const metricsKey = action.compareView === EventTypeEnum.TrainingStatsScalar ? 'metricVariants' : 'metricVariantsPlots';
    const metricsIds = action.metrics.map(metric => `last_metrics.${metric.metric_hash}.${metric.variant_hash}.value`);
    const newState = {
      ...state,
      [metricsKey]: action.metrics,
      ...(!state[selectedMetricsKey][action.projectId]?.metrics.some(metric => metricsIds.includes(metric.id)) && {
        [selectedMetricsKey]: {
          ...state[selectedMetricsKey],
          [action.projectId]: {
            lastModified: state[selectedMetricsKey][action.projectId]?.lastModified ?? (new Date()).getTime(),
            metrics: action.metrics.slice(0, 8).map(metric => createCompareMetricColumn(metric, HIDDEN_PLOTS_BY_DEFAULT))
          }
        }
      }),
      metricsLoading: false
    }

    const discardBefore = new Date();
    discardBefore.setMonth(discardBefore.getMonth() - 2);
    Object.entries(newState.compareSelectedMetrics)
      .filter(([, selectedMetric]) => discardBefore > new Date(selectedMetric.lastModified || 1648771200000))
      .forEach(([projectId]) => {
        try {
          delete newState.compareSelectedMetrics[projectId];
        } catch (err) {
          if (!(err instanceof TypeError)) {
            throw err;
          }
        }
      });

    return newState;
  }),
  on(actions.setColsOrderForProject, (state, action): ExperimentsViewState => {
    const defaultHidden = Object.entries(experimentsViewInitialState.hiddenTableCols).filter(([, isHidden]) => isHidden).map(([col]) => col);
    const defaultColsOrder = INITIAL_EXPERIMENT_TABLE_COLS.map(col => col.id).filter(col => !defaultHidden.includes(col));
    if (!state.colsOrder[action.projectId] && isEqual(action.cols, defaultColsOrder)) {
      return state;
    }
    return {...state, colsOrder: {...state.colsOrder, [action.projectId]: action.cols}}
  }),
  on(actions.setCustomHyperParams, (state, action): ExperimentsViewState => ({...state, hyperParams: action.params, metricsLoading: false})),
  on(actions.hyperParamSelectedInfoExperiments, (state, action): ExperimentsViewState =>
    ({
      ...state,
      hyperParamsOptions: {
        ...state.hyperParamsOptions,
        [action.col.id]: action.loadMore ? state.hyperParamsOptions[action.col.id].concat(action.values) : action.values
      },
      hyperParamsFiltersPage: state.hyperParamsFiltersPage + 1
    })),
  on(actions.getCustomMetrics, (state): ExperimentsViewState => ({...state, metricsLoading: true})),
  on(actions.getCustomHyperParams, (state): ExperimentsViewState => ({...state, metricsLoading: true})),
  on(actions.setSplitSize, (state, action): ExperimentsViewState => ({...state, splitSize: action.splitSize})),
  on(actions.setTableMode, (state, action): ExperimentsViewState => ({...state, tableMode: action.mode})),
  on(actions.setCompareView, (state, action): ExperimentsViewState => ({...state, tableCompareView: action.mode})),
  on(actions.toggleCompareScalarSettings, (state): ExperimentsViewState => ({...state, showCompareScalarSettings: !state.showCompareScalarSettings})),
  on(cloneExperiment, (state, action): ExperimentsViewState => ({...state,
    cloneDefaultOptions: ['forceParent', ...cloneExtraToggles().map(key => camelCase(key))]
      .reduce((acc, key) => {
        acc[key] = action.cloneData[key];
        return acc;
      }, {})
  })),
  on(removeTagSuccess, (state, action): ExperimentsViewState => ({
    ...state,
    experiments: state.experiments ? state.experiments.map(experiment => action.experiments.includes(experiment.id) ? {
        ...experiment,
        tags: experiment.tags?.filter(tag => tag !== action.tag)
      } : experiment
    ) : null,
  }))
);
