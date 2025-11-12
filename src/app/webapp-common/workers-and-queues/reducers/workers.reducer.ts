import {createReducer, on} from '@ngrx/store';
import {WorkerExt, setWorkers, workersTableSetSort, setSelectedWorker, setStats, setStatsParams, resetWorkers}
  from '../actions/workers.actions';
import {TABLE_SORT_ORDER} from '../../shared/ui-components/data/table/table.consts';
import {TIME_INTERVALS} from '../workers-and-queues.consts';
import {Topic} from '../../shared/utils/statistics';
import {SortMeta} from 'primeng/api';

export interface WorkersState {
  data: WorkerExt[];
  selectedWorker: WorkerExt;
  stats: Topic[];
  selectedStatsTimeFrame: string;
  selectedStatsParam: string;
  tableSortFields: SortMeta[];
}

const initWorkersStore: WorkersState = {
  data: null,
  selectedWorker: null,
  stats: null,
  selectedStatsTimeFrame: (3 * TIME_INTERVALS.HOUR).toString(),
  selectedStatsParam: 'cpu_usage;gpu_usage',
  tableSortFields: [{field: 'id', order: TABLE_SORT_ORDER.ASC}],
};

export const workersReducer = createReducer(
  initWorkersStore,
  on(setWorkers, (state, action): WorkersState => ({...state, data: action.workers})),
  on(setSelectedWorker, (state, action): WorkersState => ({...state, selectedWorker: action.worker})),
  on(workersTableSetSort, (state, action): WorkersState => ({...state, tableSortFields: action.orders})),
  on(setStats, (state, action): WorkersState => ({...state, stats: action.data})),
  on(resetWorkers, (): WorkersState => ({...initWorkersStore})),
  on(setStatsParams, (state, action): WorkersState => ({
    ...state,
    selectedStatsTimeFrame: action.timeFrame,
    selectedStatsParam: action.param
  })),
);
