import {MemoizedSelector} from '@ngrx/store';
import {Observable, Observer} from 'rxjs';

export interface IEntityObject<T> {
  _observer: Observer<{instance: IEntityObject<T>, force: boolean}>;
  _store: any;
  _getAction: any; // ISmGetDataAction
  _updateAction: any; // TODO:
  selector: MemoizedSelector<any, T>;
  stream$: Observable<{instance: IEntityObject<T>, force: boolean}>;
  selector$: Observable<T>;
  lastRequest: any;
  lastRequestTime: number;
  expirationTime: number; // in milliseconds
  pingingTime: number; // in milliseconds
  init(store: any): void;
  startPinging(force?: boolean): void;
  stopPinging(): void;
  getGetAction(): any; // ISmGetDataAction
  setRequest(request: any): void;
  didTimeExpire(): boolean;
}
