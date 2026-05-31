import {provideStoreDevtools} from '@ngrx/store-devtools';

export const extCoreConfig = [
  provideStoreDevtools({
    maxAge: 100,
    trace: true,
    traceLimit: 50
  })
];
