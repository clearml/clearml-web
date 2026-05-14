import {computed, inject} from '@angular/core';
import {
  signalStore,
  type,
  withComputed,
  withState
} from '@ngrx/signals';
import {eventGroup, Events, on, withEventHandlers, withReducer} from '@ngrx/signals/events';
import {Log} from '../../actions/common-experiment-output.actions';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {LOG_BATCH_SIZE} from '../../shared/common-experiments.const';
import {catchError, map, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {viewEvents} from '@common/core/state/view.events';
import {withViewBridge} from '@common/core/state/view.store';
import {sortBy} from 'lodash-es';
import {withDevtools} from '@angular-architects/ngrx-toolkit';
import {selectActiveWorkspace} from '@common/core/reducers/users-reducer';
import {from, of} from 'rxjs';
import {fromFetch} from 'rxjs/fetch';
import {HTTP} from '~/app.constants';
import {TENANT_HEADER} from '~/core/interceptors/webapp-interceptor';
import {ConfigurationService} from '@common/shared/services/configuration.service';

export const experimentOutputLogEvents = eventGroup({
  source: 'Experiment Output Log',
  events: {
    getLogs: type<{ id: string; direction: string; from?: number; refresh?: boolean }>(),
    resetLog: type<void>(),
    downloadLog: type<{ id: string }>(),
    setLog: type<{ id: string; events: Log[]; total: number; direction: string; refresh: boolean }>(),
    setLoading: type<{ loading: boolean }>(),
    setBeginningOfLog: type<{ atStart: boolean }>(),
    setLogFilter: type<{ filter: string }>(),
  }
});

export interface ExperimentOutputLogState {
  id: string;
  log: Log[];
  totalLogLines: number;
  beginningOfLog: boolean;
  logFilter: string;
  loading: boolean;
}

const initialState: ExperimentOutputLogState = {
  id: null,
  log: null,
  totalLogLines: null,
  beginningOfLog: false,
  logFilter: null,
  loading: false,
};

export const ExperimentOutputLogStore = signalStore(
  withState(initialState),
  withViewBridge(),
  withDevtools('consoleLog'),
  withComputed((state) => ({
    creator: computed(() => state.log()?.at(-1)?.worker ?? ''),
    hasLog: computed(() => Array.isArray(state.log()) ? state.log().length > 0 : null),
  })),
  withReducer(
    on(experimentOutputLogEvents.resetLog, () => ({
      ...initialState,
      logFilter: null, // Ensure filter is also reset if needed, though initialState has it null
    })),
    on(experimentOutputLogEvents.getLogs, ({payload}) => ({loading: !payload.refresh, id: payload.id})),
    on(experimentOutputLogEvents.setLoading, ({payload}, state) => ({...state, loading: payload.loading})),
    on(experimentOutputLogEvents.setLogFilter, ({payload}, state) => ({...state, logFilter: payload.filter})),
    on(experimentOutputLogEvents.setBeginningOfLog, ({payload}, state) => ({...state, beginningOfLog: payload.atStart})),
    on(experimentOutputLogEvents.setLog, ({payload}, state) => {
      if (payload.id !== state.id) {
        return state;
      }
      const events = (payload.events || []).map((e: Log) => ({...e, msg: e.msg?.replace(/\0/g, '')})).reverse();
      let currLog: Log[];
      let atStart = state.beginningOfLog;

      if (payload.direction) {
        if (payload.refresh) {
          currLog = events;
        } else if (payload.direction === 'prev') {
          if (payload.events?.length < LOG_BATCH_SIZE) {
            atStart = true;
          }
          currLog = sortBy(events.concat(state.log || []), 'timestamp');
          if (currLog.length > 300) {
            currLog = currLog.slice(0, 300);
          }
        } else {
          currLog = sortBy((state.log || []).concat(events), 'timestamp');
          if (currLog.length > 300) {
            currLog = currLog.slice(currLog.length - 300, currLog.length);
          }
        }
      } else {
        currLog = events;
      }

      return {
        ...state,
        log: currLog,
        totalLogLines: payload.total,
        beginningOfLog: atStart,
        loading: false
      };
    })
  ),
  withEventHandlers((
    store,
    events = inject(Events),
    eventsApi = inject(ApiEventsService),
    globalStore = inject(Store),
    config = inject(ConfigurationService)
  ) => ({
    downloadLog$: events.on(experimentOutputLogEvents.downloadLog).pipe(
      withLatestFrom(globalStore.select(selectActiveWorkspace)),
      switchMap(([{payload}, workspace]) => config.getStaticEnvironment().communityServer ?
        fromFetch(`${HTTP.API_BASE_URL}/events.download_task_log`,
          {
            ...(workspace?.id && {headers: {[TENANT_HEADER]: workspace.id}}),
            method: 'POST',
            credentials: 'include',

            body: JSON.stringify({task: payload.id, line_type: 'text'})
          })
          .pipe(
            switchMap(res => from(res.blob())),
            map(fileBlob => {
              const url = window.URL.createObjectURL(fileBlob);
              const a = document.createElement('a');
              a.href = url;
              a.target = '_blank';
              a.download = `Log - ${payload.id}.txt`;
              a.click();
            })
          ) :
        of(null)
          .pipe(map(() => {
            const a = document.createElement('a') as HTMLAnchorElement;
            a.target = '_blank';
            a.href = `${HTTP.API_BASE_URL}/events.download_task_log?line_type=text&task=${payload.id}`;
            a.click();
          }))
      )
    ),
    getLogs$: events.on(experimentOutputLogEvents.getLogs).pipe(
      switchMap(({payload}) => {
        if (!payload.refresh) {
          globalStore.dispatch(viewEvents.activateLoader({endpoint: 'getExperimentLog'}));
        }
        return eventsApi.eventsGetTaskLog({
          task: payload.id,
          batch_size: LOG_BATCH_SIZE,
          navigate_earlier: payload.direction !== 'next',
          from_timestamp: payload.refresh ? null : payload.from,
        }).pipe(
          mergeMap((res) => [
            experimentOutputLogEvents.setLog({
              id: payload.id,
              events: res.events,
              total: res.total,
              direction: payload.direction,
              refresh: !!payload.refresh
            }),
            ...(payload.direction === 'prev' && res.total > 0 && res.events?.length === 0 ?
              [experimentOutputLogEvents.setBeginningOfLog({atStart: true})] : []),
            viewEvents.deactivateLoader({endpoint: 'getExperimentLog'})
          ]),
          catchError(error => [
            viewEvents.requestFailed(error),
            viewEvents.deactivateLoader({endpoint: 'getExperimentLog'}),
            experimentOutputLogEvents.setLoading({loading: false})
          ])
        );
      })
    )
  }))
);
