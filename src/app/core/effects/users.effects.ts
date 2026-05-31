import {inject, Injectable} from '@angular/core';
import {Actions, ofType, createEffect} from '@ngrx/effects';
import {mergeMap, switchMap, catchError, filter, first} from 'rxjs/operators';
import {ApiServerService} from '~/business-logic/api-services/server.service';
import {ServerReportStatsOptionResponse} from '~/business-logic/model/server/serverReportStatsOptionResponse';
import {setUsageStats, updateUsageStats} from '../actions/usage-stats.actions';
import {fetchCurrentUser, fetchCurrentUserCompleted} from '@common/core/actions/users.actions';
import {UsersGetCurrentUserResponse} from '~/business-logic/model/users/usersGetCurrentUserResponse';
import {GettingStarted, setCurrentUser} from '~/core/actions/users.action';
import {requestFailed} from '@common/core/actions/http.actions';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {UserPreferences} from '@common/user-preferences';


@Injectable()
export class UserEffects {
  private actions = inject(Actions);
  private userPreferences = inject(UserPreferences);
  private userService = inject(ApiUsersService);
  private serverService = inject(ApiServerService);

  setUser$ = createEffect(() => {
    return this.actions.pipe(
      ofType(fetchCurrentUser),
      mergeMap(() => this.serverService.serverReportStatsOption({})),
      switchMap((options: ServerReportStatsOptionResponse) => [setUsageStats({
        supported: options.supported,
        allowed: options.enabled,
        currVersion: options.current_version,
        allowedVersion: options.enabled_version
      })])
    );
  });

  setStatsPref$ = createEffect(
    () => this.actions.pipe(
      ofType(updateUsageStats),
      mergeMap(
        (action) => this.serverService.serverReportStatsOption({enabled: action.allowed})
          .pipe(
            switchMap((options: ServerReportStatsOptionResponse) => [setUsageStats({
              supported: options.supported,
              allowed: options.enabled,
              currVersion: options.current_version,
              allowedVersion: options.enabled_version
            })])
          )
      )
    )
  );

  fetchUser$ = createEffect(() => this.actions.pipe(
    ofType(fetchCurrentUser),
    mergeMap(() => this.userService.usersGetCurrentUser({get_supported_features: true})
      .pipe(
        mergeMap((res: UsersGetCurrentUserResponse) => {
          return this.userPreferences.isReady$.pipe(
            filter(Boolean),
            first(),
            mergeMap(() => [
              setCurrentUser({
                user: res.user,
                gettingStarted: res.getting_started as unknown as GettingStarted, settings: res.settings
              }),
              fetchCurrentUserCompleted()
            ])
          );
        }),
        catchError(error => [fetchCurrentUserCompleted(), requestFailed(error)])
      )
    )
  ));
}
