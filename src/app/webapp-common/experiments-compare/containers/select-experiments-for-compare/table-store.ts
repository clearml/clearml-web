import {signalStoreFeature, type, withComputed, withState} from '@ngrx/signals';
import {eventGroup, on, withReducer} from '@ngrx/signals/events';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {FilterMetadata, SortMeta} from 'primeng/api';
import {ProjectsGetTaskParentsResponseParents} from '~/business-logic/model/projects/projectsGetTaskParentsResponseParents';
import {INITIAL_EXPERIMENT_COLS_ORDER, INITIAL_EXPERIMENT_TABLE_COLS} from '@common/experiments/experiment.consts';
import {decodeURIComponentSafe, TableFilter} from '@common/shared/utils/tableParamEncode';
import {isEqual} from 'lodash-es';
import {experimentsViewInitialState} from '@common/experiments/reducers/experiments-view.reducer';
import {computed, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {toSignal} from '@angular/core/rxjs-interop';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {User} from '~/business-logic/model/users/user';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';


export const tableEvents = eventGroup({
  source: 'Table',
  events: {
    setTableCols: type<{cols: ISmCol[]}>(),
    setActiveParentsFilter: type<{parents: ProjectsGetTaskParentsResponseParents[]}>(),
    setExtraColumns: type<{ columns: ISmCol[]; projectId: string }>(),
    addColumn: type<{ col: ISmCol}>(),
    removeCol: type<{ id: string; projectId: string }>(),
    clearHyperParamsCols: type<{ projectId: string }>(),
    setColsOrderForProject: type<{ cols: string[]; projectId: string }>(),
    setNoMoreExperiments: type<{ hasMore: boolean }>(),
    getParents: type<{searchValue: string; allProjects?: boolean}>(),
    setParents: type<{ parents: ProjectsGetTaskParentsResponseParents[] }>(),
    resetTablesFilterParentsOptions: type<void>(),
    tableFilterChanged: type<{ filters: TableFilter[]; projectId: string }>(),
    tableClearAllFilters: type<{ projectId: string }>(),
    getTags: type<{allProjects?: boolean}>(),
    setTags: type<{ tags: string[] }>(),
    addProjectsTag: type<{ tag: string }>(),
    toggleColHidden: type<{ columnId: string; projectId: string }>(),
    setTableFilters: type<{ filters: TableFilter[]; projectId: string }>(),
    setTableSort: type<{ orders: SortMeta[]; projectId: string }>(),
    setColumnWidth: type<{ projectId: string; columnId: string; widthPx: number }>(),
    setUsers: type<{ users: User[] }>(),
    setProjectsOptions: type<{ projects: Partial<ProjectsGetAllResponseSingle>[], projectsFilterOptionsScrillId: string }>(),
    setSystemTags: type<{ tags: string[] }>(),
  },
});


interface TableState {
  columns: ISmCol[];
  colsOrder: string[];
  users: User[];
  tableFilters: Record<string, FilterMetadata>;
  parents: ProjectsGetTaskParentsResponseParents[];
  projectsFilterOptions: Partial<ProjectsGetAllResponseSingle>[];
  projectsFilterOptionsScrillId: string;
  tags: string[];
  types: string[];
  systemTags: string[];
  noMoreExperiments: boolean;
  activeParentsFilter: ProjectsGetTaskParentsResponseParents[];
  metricsCols: Record<string, ISmCol[]>;
  hiddenProjectTableCols: Record<string, Record<string, boolean | undefined>>;
  projectColumnFilters: Record<string, Record<string, FilterMetadata>>;
  projectColumnsSortOrder: Record<string, SortMeta[]>;
  projectColumnsWidth: Record<string, Record<string, number>>;

}

const tableState: TableState = {
  activeParentsFilter: [],
  columns: [],
  colsOrder: [],
  noMoreExperiments: false,
  parents: [],
  projectsFilterOptions: [],
  projectsFilterOptionsScrillId: undefined,
  systemTags: [],
  tableFilters: undefined,
  tags: [],
  types: [],
  users: [],
  metricsCols: {},
  hiddenProjectTableCols: {},
  projectColumnFilters: {},
  projectColumnsSortOrder: {'*': [...INITIAL_EXPERIMENT_COLS_ORDER]},
  projectColumnsWidth: {}

};

export function withTableStore() {
  return signalStoreFeature(
    withState(tableState),
    // withDevtools('table'),
    withComputed(({columns: cols, hiddenProjectTableCols: hidden, projectColumnsWidth: colWidth, metricsCols, projectColumnsSortOrder}, store = inject(Store) ) => {
      const routerParams = toSignal(store.select(selectRouterParams));
        return {
          tableCols: computed(() => cols()?.map(col => ({
            ...col,
            hidden: !!hidden()[col.id],
            style: {...col.style, ...(col.id !== EXPERIMENTS_TABLE_COL_FIELDS.SELECTED && colWidth()[col.id] && {width: `${colWidth()[col.id]}px`})}
          } as ISmCol))),
          tableSortFields: computed(() => projectColumnsSortOrder()[routerParams()?.projectId] ?? [...INITIAL_EXPERIMENT_COLS_ORDER]),
          metricsColsForProject: computed(() => metricsCols()[routerParams()?.projectId]
            ?.map(col => ({
              ...col,
              hidden: !!hidden()[col.id],
              style: {...col.style, ...(colWidth()[col.id] && {width: `${colWidth()[col.id]}px`})}
            } as ISmCol)) ?? [])
        }
      }),
    withReducer(
      on(tableEvents.setTableCols, ({payload}) => ({columns: payload.cols})),
      on(tableEvents.setActiveParentsFilter, ({payload}) => ({activeParentsFilter: payload.parents})),
      on(tableEvents.setExtraColumns, ({payload}, state) => {
        if (!state.metricsCols[payload.projectId] && payload.columns.length === 0) {
          return state;
        }
        return {
          metricsCols: {
            ...state.metricsCols,
            [payload.projectId]: payload.columns
          }
        };
      }),
      on(tableEvents.addColumn, ({payload}, state) => {
        const column = payload.col;
        const hiddenColumns = {...state.hiddenProjectTableCols[column.projectId]};
        delete hiddenColumns[column.id];
        return {
          metricsCols: {
            ...state.metricsCols,
            [column.projectId]: [...(state.metricsCols[column.projectId] ?? []), column]
          },
          hiddenProjectTableCols: {
            ...state.hiddenProjectTableCols,
            [column.projectId]: hiddenColumns
          }
        };
      }),
      on(tableEvents.removeCol, ({payload}, state) => {
        const columnId = decodeURIComponentSafe(payload.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {[columnId]: removedCol, ...remainingColsWidth} = state.projectColumnsWidth[payload.projectId] || {};
        return {
          ...state,
          metricsCols: {
            ...state.metricsCols,
            [payload.projectId]: state.metricsCols[payload.projectId]?.filter(tableCol => !(tableCol.id === columnId))
          },
          projectColumnsSortOrder: {
            ...state.projectColumnsSortOrder,
            [payload.projectId]: state.projectColumnsSortOrder[payload.projectId]?.filter(order => order.field !== columnId)
          },
          projectColumnsWidth: {
            ...state.projectColumnsWidth,
            [payload.projectId]: Object.keys(remainingColsWidth).length > 0 ? remainingColsWidth : undefined
          },
          colsOrder: {
            ...state.colsOrder,
            [payload.projectId]: state.colsOrder[payload.projectId]?.filter(colId => colId !== columnId)
          }
        };
      }),
      on(tableEvents.clearHyperParamsCols, ({payload}, state) => ({
          ...state,
          metricsCols: {
            ...state.metricsCols,
            [payload.projectId]: state.metricsCols[payload.projectId]?.filter(tableCol => !(tableCol.id.startsWith('hyperparams')))
          },
          projectColumnsSortOrder: {
            ...state.projectColumnsSortOrder,
            [payload.projectId]: state.projectColumnsSortOrder[payload.projectId]?.filter(order => order.field.startsWith('hyperparams'))
          }
        })),
      on(tableEvents.setColsOrderForProject, ({payload}, state) => {
        const defaultHidden = Object.entries(experimentsViewInitialState.hiddenTableCols).filter(([, isHidden]) => isHidden).map(([col]) => col);
        const defaultColsOrder = INITIAL_EXPERIMENT_TABLE_COLS.map(col => col.id).filter(col => !defaultHidden.includes(col));
        if (!state.colsOrder[payload.projectId] && isEqual(payload.cols, defaultColsOrder)) {
          return state;
        }
        return {...state, colsOrder: {...state.colsOrder, [payload.projectId]: payload.cols}};
      }),
      on(tableEvents.setNoMoreExperiments, ({payload}) => ({noMoreExperiments: payload.hasMore})),
      on(tableEvents.setParents, ({payload}) => ({parents: payload.parents})),
      on(tableEvents.resetTablesFilterParentsOptions, () => ({parents: null})),
      on(tableEvents.setTags, ({payload}) => ({tags: payload.tags})),
      on(tableEvents.addProjectsTag, ({payload}, state) => ({tags: Array.from(new Set(state.tags.concat(payload.tag))).sort()})),
      on(tableEvents.toggleColHidden, ({payload}, state) => {
        let newHiddenCols = {...(state.hiddenProjectTableCols[payload.projectId] || experimentsViewInitialState.hiddenTableCols)};
        newHiddenCols = {...newHiddenCols, [payload.columnId]: !newHiddenCols?.[payload.columnId]};

        if (!state.hiddenProjectTableCols[payload.projectId] && isEqual(newHiddenCols, experimentsViewInitialState.hiddenProjectTableCols)) {
          return state;
        }
        return {
          ...state,
          hiddenProjectTableCols: {
            ...state.hiddenProjectTableCols,
            [payload.projectId]: newHiddenCols
          }
        };
      }),
      on(tableEvents.tableClearAllFilters, ({payload}, state) => ({
          projectColumnFilters: {
            ...state.projectColumnFilters,
            [payload.projectId]: {}
          }
        })),
      on(tableEvents.setTableFilters, ({payload}, state) => {
          const newFilters = payload.filters.reduce((obj, filter: TableFilter) => {
            obj[filter.col] = {
              value: filter.value,
              ...(filter.filterMatchMode && {matchMode: filter.filterMatchMode})
            };
            return obj;
          }, {} as Record<string, { value: string; matchMode: string }>);

          if (state.projectColumnFilters[payload.projectId] &&
              isEqual(newFilters, state.projectColumnFilters[payload.projectId])) {
            return state;
          }
          return {
            projectColumnFilters: {
              ...state.projectColumnFilters,
              [payload.projectId]: {...newFilters}
            }
          }
        }),
      on(tableEvents.setTableSort, ({payload}, state) => {
        const colIds = state.columns.map(col => col.id).concat(state.metricsCols[payload.projectId]?.map(col => col.id) ?? []);
        let orders = payload.orders.filter(order => colIds.includes(order.field));
        orders = orders.length > 0 ? orders : null;
        // if (!state.projectColumnsSortOrder[payload.projectId] && isEqual(orders, INITIAL_EXPERIMENT_COLS_ORDER)) {
        //   return state;
        // }
        return {projectColumnsSortOrder: {...state.projectColumnsSortOrder, [payload.projectId]: orders}};
      }),
      on(tableEvents.tableFilterChanged, ({payload}, state) => ({
          projectColumnFilters: {
            ...state.projectColumnFilters,
            [payload.projectId]: {
              ...state.projectColumnFilters[payload.projectId],
              [payload.filters[0].col]: {value: payload.filters[0].value, matchMode: payload.filters[0].filterMatchMode}
            }
          }
        })),
      on(tableEvents.toggleColHidden, ({payload}, state) => {
        let newHiddenCols = {...(state.hiddenProjectTableCols[payload.projectId] || experimentsViewInitialState.hiddenTableCols)};
        newHiddenCols = {...newHiddenCols, [payload.columnId]: !newHiddenCols?.[payload.columnId]};

        if (!state.hiddenProjectTableCols[payload.projectId] && isEqual(newHiddenCols, experimentsViewInitialState.hiddenProjectTableCols)) {
          return state;
        }
        return {
          hiddenProjectTableCols: {
            ...state.hiddenProjectTableCols,
            [payload.projectId]: newHiddenCols
          }
        };
      }),
      on(tableEvents.setColumnWidth, ({payload}, state) => ({
        projectColumnsWidth: {
          ...state.projectColumnsWidth,
          [payload.projectId]: {
            ...state.projectColumnsWidth[payload.projectId],
            [payload.columnId]: payload.widthPx
          }
        }
      })),
      on(tableEvents.setUsers, ({payload}) => ({users: payload.users})),
      on(tableEvents.setProjectsOptions, ({payload}) => ({
        projectsFilterOptions: payload.projects,
        projectsFilterOptionsScrillId: payload.projectsFilterOptionsScrillId,
      })),
      on(tableEvents.setSystemTags, ({payload}) => ({systemTags: payload.tags})),
    )
  );
}
