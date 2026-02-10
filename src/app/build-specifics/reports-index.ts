import {provideStoreDevtools} from '@ngrx/store-devtools';

export const extCoreConfig = [
  provideStoreDevtools({
    maxAge: 75,
    trace: true,
    traceLimit: 50,
    connectInZone: true
  })
];

export const extCoreEffects =     []
