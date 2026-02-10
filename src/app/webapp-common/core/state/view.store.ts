import {signalStoreFeature} from '@ngrx/signals';
import {Events, withEffects} from '@ngrx/signals/events';
import {inject} from '@angular/core';
import {filter, map} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {activeLoader, addMessage, deactivateLoader, setServerError} from '../actions/layout.actions';
import {requestFailed} from '@common/core/actions/http.actions';
import {viewEvents} from '@common/core/state/view.events';



export function withViewBridge() {
  return signalStoreFeature(
    withEffects((
        store,
        events = inject(Events),
        globalStore = inject(Store),
      ) => ({
        serverErrorMoreInfo: events
          .on(viewEvents.setServerError)
          .pipe(
            filter((event) => !!event.payload),
            map(({payload: action}) => {
              globalStore.dispatch(setServerError(action.serverError, action.contextSubCode, action.customMessage, action.aggregateSimilar, action.errorHeader));
            }),
          ),

        addMessage: events
          .on(viewEvents.addMessage)
          .pipe(
            map(({payload}) => {
              globalStore.dispatch(addMessage(payload.severity, payload.msg, payload.userActions, payload.suppressNextMessages));
            }),
          ),

        requestFailed: events
          .on(viewEvents.requestFailed)
          .pipe(
            map(({payload}) => {
              globalStore.dispatch(requestFailed(payload.err));
            })
          ),

        activateLoader: events
          .on(viewEvents.activateLoader)
          .pipe(
            map(({payload}) => {
              globalStore.dispatch(activeLoader(payload.endpoint));
            })
          ),

        deactivateLoader: events
          .on(viewEvents.deactivateLoader)
          .pipe(
            map(({payload}) => {
              globalStore.dispatch(deactivateLoader(payload.endpoint));
            })
          ),
      })
    ),
  );
}
