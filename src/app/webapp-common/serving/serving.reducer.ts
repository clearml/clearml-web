import {createFeature, createReducer, createSelector, on} from '@ngrx/store';
import {ServingActions, servingLoadingTableColFields, servingTableColFields} from './serving.actions';
import {FilterMetadata} from 'primeng/api';
import {SortMeta} from 'primeng/api';
import {SearchState, selectSearchQuery} from '@common/common-search/common-search.reducer';
import {ISmCol, TABLE_SORT_ORDER} from '@common/shared/ui-components/data/table/table.consts';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {setSelectedProject} from '@common/core/actions/projects.actions';
import {TableFilter} from '@common/shared/utils/tableParamEncode';
import {
  filterEndpoints,
  servingLoadingTableCols,
  servingTableCols,
  sortAndFilterEndpoints
} from '@common/serving/serving.consts';
import {ServingGetEndpointDetailsResponse} from '~/business-logic/model/serving/servingGetEndpointDetailsResponse';
import {TIME_INTERVALS} from '@common/workers-and-queues/workers-and-queues.consts';
import {ServingGetEndpointMetricsHistoryRequest} from '~/business-logic/model/serving/servingGetEndpointMetricsHistoryRequest';
import MetricTypeEnum = ServingGetEndpointMetricsHistoryRequest.MetricTypeEnum;
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {ContainerInfo} from '~/business-logic/model/serving/containerInfo';
import {Topic} from '@common/shared/components/charts/line-chart/line-chart.component';

export const servingFeatureKey = 'serving';

export interface State {
  splitSize: number;
  endpoints: EndpointStats[];
  loadingEndpoints: ContainerInfo[];
  // tableFilters: Record<string, FilterMetadata>;
  tempFilters: Record<string, FilterMetadata>;
  columnFilters: Record<string, FilterMetadata>;
  colsOrder: string[];
  tableSortFields: SortMeta[];
  columnsWidth: Record<string, number>;
  loadingColumnFilters: Record<string, FilterMetadata>;
  loadingColsOrder: string[];
  loadingTableSortFields: SortMeta[];
  loadingColumnsWidth: Record<string, number>;
  hiddenTableCols: Record<string, boolean>;
  selectedEndpoints: EndpointStats[];
  selectedEndpoint: EndpointStats;
  endpointDetails: ServingGetEndpointDetailsResponse;
  // noMoreEndpoint: boolean;
  // scrollId: string;
  globalFilter: SearchState['searchQuery'];
  showAllSelectedIsActive: boolean;
  tags: string[];
  metricsCols: ISmCol[];
  metricVariants: MetricVariantResult[];
  tableMode: 'info' | 'table';
  statsTimeFrame: string;
  statsParam: string;
  stats: Record<MetricTypeEnum, Topic[]>;
  showNoStatsNotice: boolean;
  hiddenCharts: string[];
  instancesLinks: Record<string, string>[];
}

export const initialState: State = {
  endpoints: null,
  loadingEndpoints: null,
  splitSize: 65,
  hiddenTableCols: {comment: true, id: true},
  // tableFilters: {},
  tempFilters: {},
  tableSortFields: [],
  loadingTableSortFields: [],
  metricsCols: [],
  metricVariants: null,
  columnFilters: {},
  loadingColumnFilters: {},
  columnsWidth: {},
  loadingColumnsWidth: {},
  selectedEndpoints: [],
  colsOrder: [],
  loadingColsOrder: [],
  selectedEndpoint: null,
  endpointDetails: null,
  globalFilter: null,
  showAllSelectedIsActive: false,
  tags: [],
  tableMode: 'table',
  statsParam: 'cpu_usage;gpu_usage',
  statsTimeFrame: (3 * TIME_INTERVALS.HOUR).toString(),
  stats: null,
  showNoStatsNotice: false,
  hiddenCharts: [],
  instancesLinks: null
};

export const reducer = createReducer(
  initialState,
  on(ServingActions.resetState, (state): State => ({
    ...state,
    endpoints: initialState.endpoints,
    loadingEndpoints: initialState.loadingEndpoints,
    selectedEndpoint: initialState.selectedEndpoint,
    endpointDetails: initialState.endpointDetails
  })),
  on(setSelectedProject, (state): State => ({...state, selectedEndpoints: initialState.selectedEndpoints})),
  on(ServingActions.addServingEndpoints, (state, action): State =>
    ({...state, endpoints: state.endpoints?.concat(action.servingEndpoints) || null})),
  on(ServingActions.showSelectedOnly, (state, action): State =>
    ({
      ...state,
      showAllSelectedIsActive: action.active,
      globalFilter: initialState.globalFilter,
      tempFilters: state.columnFilters || {},
      ...(state.showAllSelectedIsActive && {columnFilters: action.active ? initialState.columnFilters : state.tempFilters})
    })),
  on(ServingActions.setServingEndpoints, (state, action): State =>
    ({...state, endpoints: action.servingEndpoints})),
  on(ServingActions.setLoadingEndpoints, (state, action): State =>
    ({...state, loadingEndpoints: action.servingEndpoints})),
  on(ServingActions.setServingEndpointsInPlace, (state, action): State =>
    ({
      ...state, endpoints: state.endpoints?.map(currModel => action.servingEndpoints?.find(newModel => newModel.id === currModel.id)) || null
    })),
  on(ServingActions.setSelectedServingEndpoints, (state, action): State =>
    ({...state, selectedEndpoints: action.servingEndpoints as unknown as EndpointStats[]})),
  on(ServingActions.setSelectedServingEndpoint, (state, action): State =>
    ({...state, selectedEndpoint: action.endpoint})),
  on(ServingActions.setServingEndpointDetails, (state, action): State =>
    ({...state, endpointDetails: action.endpoint})),
  on(ServingActions.globalFilterChanged, (state, action): State =>
    ({...state, globalFilter: action})),
  on(ServingActions.resetGlobalFilter, (state): State =>
    ({...state, globalFilter: initialState.globalFilter})),
  on(ServingActions.toggleColHidden, (state, action): State =>
    ({
      ...state,
      hiddenTableCols: {
        ...(state.hiddenTableCols || initialState.hiddenTableCols),
        [action.columnId]: state.hiddenTableCols?.[action.columnId] ? undefined : true
      }
    })),
  on(ServingActions.setHiddenCols, (state, action): State =>
    ({...state, hiddenTableCols: action.hiddenCols})),
  on(ServingActions.addColumn, (state, action): State =>
    ({...state, metricsCols: [...state.metricsCols, action.col]})),
  on(ServingActions.removeColumn, (state, action): State => ({
    ...state,
    metricsCols: [...state.metricsCols.filter(tableCol => !(tableCol.key === action.id))],
    colsOrder: state.colsOrder ? state.colsOrder.filter(colId => colId !== action.id) : null
  })),
  on(ServingActions.setExtraColumns, (state, action): State =>
    ({
      ...state,
      metricsCols: [...state.metricsCols, ...action.columns]
    })),
  on(ServingActions.setTags, (state, action): State => ({...state, tags: action.tags})),
  on(ServingActions.addTag, (state, action): State => ({...state, tags: Array.from(new Set(state.tags.concat(action.tag))).sort()})),
  on(ServingActions.setTableSort, (state, action): State => {
    const colIds = (Object.values(servingTableColFields) as string[]).concat(state.metricsCols.map(col => col.id));
    let orders = action.orders.filter(order => colIds.includes(order.field));
    orders = orders.length > 0 ? orders : null;
    return {
      ...state,
      tableSortFields: orders
    };
  }),
  on(ServingActions.setColumnWidth, (state, action): State => ({
    ...state,
    columnsWidth: {
      ...state.columnsWidth,
      [action.columnId]: action.widthPx
    }
  })),
  on(ServingActions.setColsOrder, (state, action): State =>
    ({...state, colsOrder: action.cols})),
  on(ServingActions.setTableFilters, (state, action): State => ({
    ...state,
    columnFilters: {
      ...action.filters.reduce((obj, filter: TableFilter) => {
        obj[filter.col] = {value: filter.value, matchMode: filter.filterMatchMode};
        return obj;
      }, {} as Record<string, FilterMetadata>)
    }
  })),
  on(ServingActions.setLoadingTableSort, (state, action): State => {
    const colIds = (Object.values(servingLoadingTableColFields) as string[]);
    let orders = action.orders.filter(order => colIds.includes(order.field));
    orders = orders.length > 0 ? orders : null;
    return {
      ...state,
      loadingTableSortFields: orders
    };
  }),
  on(ServingActions.setLoadingColumnWidth, (state, action): State => ({
    ...state,
    loadingColumnsWidth: {
      ...state.columnsWidth,
      [action.columnId]: action.widthPx
    }
  })),
  on(ServingActions.setLoadingColsOrder, (state, action): State =>
    ({...state, loadingColsOrder: action.cols})),
  on(ServingActions.setLoadingTableFilters, (state, action): State => ({
    ...state,
    loadingColumnFilters: {
      ...action.filters.reduce((obj, filter: TableFilter) => {
        obj[filter.col] = {value: filter.value, matchMode: filter.filterMatchMode};
        return obj;
      }, {} as Record<string, FilterMetadata>)
    }
  })),
  on(ServingActions.removeMetricColumn, (state, action): State => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {[action.id]: removedCol, ...remainingColsWidth} = state.columnsWidth || {};
    return {
      ...state,
      metricsCols: [...state.metricsCols.filter(tableCol => tableCol.id !== action.id)],
      tableSortFields: state.tableSortFields?.filter(order => order.field !== action.id) || null,
      columnsWidth: remainingColsWidth,
      colsOrder: state.colsOrder ? state.colsOrder.filter(colId => colId !== action.id) : null
    };
  }),
  on(ServingActions.setSplitSize, (state, action): State =>
    ({...state, splitSize: action.splitSize})),
  on(ServingActions.setTableViewMode, (state, action): State => ({...state, tableMode: action.mode})),
  on(ServingActions.setCustomMetrics, (state, action): State => ({...state, metricVariants: action.metrics})),
  on(ServingActions.setStats, (state, action): State => ({
    ...state,
    stats: {
      ...state.stats,
      ...action.data
    }
  })),
  on(ServingActions.showStatsErrorNotice, (state, action): State => ({...state, showNoStatsNotice: action.show})),
  on(ServingActions.setStatsTimeframe, (state, action): State => ({...state, statsTimeFrame: action.timeFrame})),
  on(ServingActions.setChartHidden, (state, action): State => ({...state, hiddenCharts: action.hiddenList})),
  on(ServingActions.setModelsSourceLinks, (state, action): State => ({...state, instancesLinks: action.modelsLinks}))
);

export const servingFeature = createFeature({
  name: servingFeatureKey,
  reducer,
  extraSelectors: ({
                     selectHiddenTableCols, selectColumnsWidth, selectLoadingColumnsWidth,
                     selectMetricsCols, selectLoadingTableSortFields, selectTableSortFields,
                     selectStats, selectLoadingColumnFilters, selectColumnFilters, selectEndpoints, selectLoadingEndpoints
                   }) => {
    const selectServingTableColumns = createSelector(selectHiddenTableCols, selectColumnsWidth, (hiddenTableCols, columnsWidth) => servingTableCols.map(col => ({
      ...col,
      // hidden: !!hiddenTableCols[col.id],
      style: {...col.style, ...(columnsWidth[col.id] && {width: `${columnsWidth[col.id]}px`})}
    } as ISmCol)));

    const selectLoadingServingTableColumns = createSelector(selectLoadingColumnsWidth, (columnsWidth) => servingLoadingTableCols.map(col => ({
      ...col,
      style: {...col.style, ...(columnsWidth[col.id] && {width: `${columnsWidth[col.id]}px`})}
    } as ISmCol)));

    const selectFilteredTableCols = createSelector(selectServingTableColumns, selectMetricsCols, (tableCols, metaCols) =>
      tableCols.concat(metaCols.map(col => ({...col, meta: true})))
    );

    const selectTableSortFields1 = createSelector(selectTableSortFields, (sortFields) =>
        sortFields?.length > 0 ? sortFields : [{
          field: servingTableColFields.uptime,
          order: TABLE_SORT_ORDER.DESC
        }]
    );
    const selectLoadingTableSortFields1 = createSelector(selectLoadingTableSortFields, (sortFields) =>
      sortFields?.length > 0 ? sortFields : [{
          field: servingTableColFields.uptime,
          order: TABLE_SORT_ORDER.DESC
        }]
    );
    const modelNamesOptions = createSelector(selectEndpoints,endpoints =>
      Array.from(new Set(endpoints?.map(endpoint => endpoint.model).filter(i => !!i) ?? [])));
    const modelLoadingNamesOptions = createSelector(selectLoadingEndpoints, (endpoints) =>
      Array.from(new Set(endpoints?.map(endpoint => endpoint.model).filter(i => !!i) ?? [])));
    const inputTypesOptions = createSelector(selectLoadingEndpoints, (endpoints) =>
      Array.from(new Set(endpoints?.map(endpoint => endpoint.input_type).filter(i => !!i) ?? [])));
    const preprocessArtifactOptions = createSelector(selectLoadingEndpoints, (endpoints) =>
      Array.from(new Set(endpoints?.map(endpoint => endpoint.preprocess_artifact).filter(i => !!i) ?? [])));
    const selectSortedFilteredEndpoints = createSelector(selectEndpoints, selectColumnFilters, selectTableSortFields1, selectSearchQuery,
      (endpoints, filters, sortFields, sq) =>
        filterEndpoints(sortAndFilterEndpoints(endpoints, filters, sortFields), sq)
    );
    const selectLoadingSortedFilteredEndpoints = createSelector(selectLoadingEndpoints, selectLoadingColumnFilters, selectLoadingTableSortFields1, selectSearchQuery,
      (endpoints, filters, sortFields, sq) =>
        filterEndpoints(sortAndFilterEndpoints(endpoints, filters, sortFields), sq)
    );
    const selectStatsFormMetric = (metricType: MetricTypeEnum) => createSelector(selectStats, (stats) => stats?.[metricType]);
    const selectAllSeriesLegends = createSelector(selectStats, (stats) =>  Array.from(new Set(Object.values(stats).flat().map(a => a.topicName))));
    return {
      selectServingTableColumns,
      selectLoadingServingTableColumns,
      selectFilteredTableCols,
      selectTableSortFields: selectTableSortFields1,
      selectLoadingTableSortFields: selectLoadingTableSortFields1,
      selectStatsFormMetric,
      modelNamesOptions,
      modelLoadingNamesOptions,
      inputTypesOptions,
      preprocessArtifactOptions,
      selectSortedFilteredEndpoints,
      selectLoadingSortedFilteredEndpoints,
      selectAllSeriesLegends
    };
  }
});

