import {createAction, props} from '@ngrx/store';
import {Worker} from '~/business-logic/model/workers/worker';
import {Topic} from '../../shared/utils/statistics';
import {SortMeta} from 'primeng/api';

const workersPrefix = '[WORKERS] ';

export interface WorkerExt extends Omit<Worker, 'id'> {
  id: string;
  name: string;
  originalName: string;
}

export const resetWorkers = createAction(
  workersPrefix + 'reset workers'
);

export const getWorkers = createAction(
  workersPrefix + 'get workers'
);

export const getWorkerStats = createAction(
  workersPrefix + 'get stats',
  props<{maxPoints: number}>()
);

export const setWorkers = createAction(
  workersPrefix + 'set workers',
  props<{workers: WorkerExt[]}>()
);

export const setSelectedWorker = createAction(
  workersPrefix + 'set selected worker',
  props<{worker: WorkerExt}>()
);

export const workersTableSortChanged = createAction(
  workersPrefix + 'table sort changed',
  props<{  colId: string; isShift: boolean }>()
);


export const workersTableSetSort = createAction(
  workersPrefix + 'set table sort',
  props<{ orders: SortMeta[] }>()
);

export const setStats = createAction(
  workersPrefix + 'set stats',
  props<{data: Topic[]}>()
);

export const setStatsParams = createAction(
  workersPrefix + 'set stats parameters',
  props<{ timeFrame: string; param: string; maxPoints: number }>()
);
