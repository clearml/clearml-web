import {type} from '@ngrx/signals';
import {HttpErrorResponse} from '@angular/common/http';
import {MessageSeverityEnum} from '@common/constants';
import {Action} from '@ngrx/store';
import {eventGroup} from '@ngrx/signals/events';


export const viewEvents =  eventGroup({
  source: 'tenant usages',
  events: {
    setServerError: type<{
      serverError: HttpErrorResponse;
      contextSubCode?: number;
      customMessage?: string;
      aggregateSimilar?: boolean;
      errorHeader?: string;
    }>(),
    addMessage: type<{
      severity: MessageSeverityEnum;
      msg: string;
      suppressNextMessages?: boolean;
      userActions?: {
        actions: Action[];
        name: string;
      }[],
    }>(),
    setBackdrop: type<{ active: boolean }>(),
    activateLoader: type<{ endpoint: string}>(),
    deactivateLoader: type<{ endpoint: string}>(),
    requestFailed: type<{ err: HttpErrorResponse }>(),
  }
});
