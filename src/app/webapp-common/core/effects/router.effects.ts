import {Injectable} from '@angular/core';
import {ActivatedRoute, NavigationExtras, Params, Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {uniq} from 'lodash-es';
import {map, tap} from 'rxjs/operators';
import {encodeFilters, encodeOrder} from '../../shared/utils/tableParamEncode';
import {navigationEnd, setRouterSegments, setURLParams} from '../actions/router.actions';


@Injectable()
export class RouterEffects {

  constructor(
    private actions$: Actions, private router: Router,
    private route: ActivatedRoute
  ) {
  }

  routerNavigationEnd = createEffect(() => this.actions$.pipe(
    ofType(navigationEnd),
    map(() => setRouterSegments({
      url: this.getRouterUrl(),
      params: this.getRouterParams(),
      config: this.getRouterConfig(),
      queryParams: this.route.snapshot.queryParams,
      data: this.route.snapshot.firstChild?.data
    }))
  ));

  setTableParams = createEffect(() => this.actions$.pipe(
    ofType(setURLParams),
    tap((action) => {
      const firstUpdate = !this.route.snapshot.queryParams.order;
      const extra = {
        // relativeTo: this.route,
        ...(firstUpdate && {replaceUrl: true}),
        ...(action.update && {queryParamsHandling: 'merge'}),
        queryParams: {
          ...(action.columns && {columns: uniq(action.columns)}),
          ...(action.orders && {order: encodeOrder(action.orders)}),
          ...(action.filters && {filter: encodeFilters(action.filters)}),
          ...(action.gsFilters && {gsfilter: encodeFilters(action.gsFilters)}),
          ...(action.isArchived !== undefined && {archive: action.isArchived ? 'true' : null}),
          ...(action.isDeep && {deep: true}),
          ...(action.version && {version: action.version}),
          ...(action.others && action.others)
        }
      } as NavigationExtras;
      this.router.navigate([], extra);
    })
  ), {dispatch: false});

  getRouterParams(): Params {
    let route = this.route.snapshot.firstChild;
    let params: Params = {};

    while (route) {
      params = {...params, ...route.params};
      route = route.firstChild;
    }
    return params;
  }

  getRouterConfig(): string[] {
    let route = this.route.snapshot.firstChild;
    let config = [];

    while (route) {
      const path = route.routeConfig.path.split('/').filter((item) => !!item);
      config = config.concat(path);
      route = route.firstChild;
    }
    return config;
  }

  getRouterUrl(): string {
    return this.router.url;
  }
}

