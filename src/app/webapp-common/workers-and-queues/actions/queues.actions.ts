import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {Queue as BLQueue} from '~/business-logic/model/queues/queue';
import {SortMeta} from 'primeng/api';
import {Topic} from '@common/shared/components/charts/line-chart/line-chart.component';

export interface Queue extends Omit<BLQueue, 'id'> {
  id: string;
  caption: string;
  profile_connection: {profile: string; policy: string; user_group: string; policy_name?: string}
}

export const queueActions = createActionGroup({
  source: 'Queues',
  events: {
    'get queues': props<{autoRefresh?: boolean}>(),
    'set queues': props<{ queues: Queue[] }>(),
    'queues table sort changed': props<{ colId: string; isShift: boolean }>(),
    'queues table set sort': props<{ orders: SortMeta[] }>(),
    'clear queue': props<{ queue?: Queue }>(),
    'fetch queue': props<{id: string, autoRefresh?: boolean}>(),
    'fetch queue success': props<{ queue?: Queue }>(),
    'delete queue': props<{ queue?: Queue }>(),
    'move experiment to bottom of queue': props<{ task: string }>(),
    'move experiment to top of queue': props<{ task: string }>(),
    'move experiment in queue': props<{ queueId: string; task: string; current: number; previous: number }>(),
    'remove experiment from queue': props<{ task: string }>(),
    'move experiment to other queue': props<{ task: string; queueId: string; queueName: string }>(),
    'get stats': props<{ maxPoints?: number }>(),
    'set stats': props<{ data: { wait: Topic[]; length: Topic[] } }>(),
    'reset queues': emptyProps(),
    'reset stats': emptyProps(),
    'set stats params': props<{ timeFrame: string; maxPoints?: number }>(),
  }
});
