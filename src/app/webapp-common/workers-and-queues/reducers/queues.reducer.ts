import {queueActions, Queue} from '../actions/queues.actions';
import {QUEUES_TABLE_COL_FIELDS, TIME_INTERVALS} from '../workers-and-queues.consts';
import {TABLE_SORT_ORDER} from '../../shared/ui-components/data/table/table.consts';
import {SortMeta} from 'primeng/api';
import {ITask} from '~/business-logic/model/al-task';
import {createReducer, on} from '@ngrx/store';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {Topic} from '@common/shared/components/charts/line-chart/line-chart.component';

export interface State {
  data: Queue[];
  selected: Queue;
  tasks: ITask[];
  stats: {wait: Topic[]; length: Topic[]};
  selectedStatsTimeFrame: string;
  tableSortFields: SortMeta[];
}

const initQueues: State = {
  data: null,
  selected: null,
  tasks: null,
  stats: {wait: null, length: null},
  selectedStatsTimeFrame: (3 * TIME_INTERVALS.HOUR).toString(),
  tableSortFields: [{field: QUEUES_TABLE_COL_FIELDS.NAME, order: TABLE_SORT_ORDER.ASC}],
};

export const reducer = createReducer(
  initQueues,
  on(queueActions.setQueues, (state, action): State => ({...state, data: action.queues})),
  on(queueActions.fetchQueue, (state, action): State =>
    ({...state, ...(!action.autoRefresh && {selected: initQueues.selected})})),
  on(queueActions.fetchQueueSuccess, (state, action): State =>
    ({ ...state, selected: action.queue})),
  on(queueActions.setStats, (state, action): State => ({...state, stats: action.data})),
  on(queueActions.resetQueues, (): State => ({...initQueues})),
  on(queueActions.resetStats, (state): State => ({...state, stats: initQueues.stats})),
  on(queueActions.setStatsParams, (state, action): State =>
    ({...state, selectedStatsTimeFrame: action.timeFrame, stats: initQueues.stats})),
  on(queueActions.queuesTableSetSort, (state, action): State =>
    ({...state, tableSortFields: action.orders})),
  on(queueActions.moveExperimentInQueue, (state, action): State => {
    const entries = state.selected.entries.slice();
    moveItemInArray(entries, action.previous, action.current);
    return {
      ...state,
      selected: {...state.selected, entries}
    }
  }),
);
