import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {Observable, of} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {cloneDeep, isEqual, get, set} from 'lodash-es';
import {UsersSetPreferencesRequest} from '~/business-logic/model/users/usersSetPreferencesRequest';
import {Injectable} from '@angular/core';

const USER_PREFERENCES_STORAGE_KEY = '_USER_PREFERENCES_';


export const enum USER_PREFERENCES_KEY {
  firstLogin = 'firstLogin',
}

@Injectable()
export class UserPreferences {

  private preferences: Record<string, any>;
  private timer: number;
  private prefsQueue: Record<string, any> = {};

  constructor(private userService: ApiUsersService) {
    this.removeFromLocalStorage();
  }

  loadPreferences(): Observable<Record<string, any>> {
    return this.userService.usersGetPreferences({})
      .pipe(
        map(res => res.preferences),
        map(pref => {
          this.preferences = pref;
          this.checkIfFirstTimeLoginAndSaveData(pref);
          this.cleanPreferencesInPreferences(pref);
          this.migrateArrayPreferencesToObjects(pref);
          let prefsString = JSON.stringify(pref);
          prefsString = prefsString.split('--DOT--').join('.');
          pref = JSON.parse(prefsString);
          return pref;
        }),
        catchError((err) => {
          // in case of 401 we have login logic in other places - throw it
          if (err.status !== 401) {
            return of({});
          } else {
            throw err;
          }

        }),
        tap(preferences => this.preferences = preferences)
      );
  }

  public setPreferences(path: string | string[], value: any) {
    if (this.preferences && !isEqual(get(this.preferences, path), value)) {
      const clonedValue = cloneDeep(value);
      this.preferences = set(this.preferences, path, value);
      this.replaceDots(clonedValue);
      if (Array.isArray(path)) {
        path = path.map(p => p.replace('.', '--DOT--')).join('.');
      }
      this.prefsQueue[path] = clonedValue;


      clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        this.saveToServer(this.prefsQueue);
        this.prefsQueue = {};
      }, 2000);
      return;
    }
  }

  private replaceDots(prefs: any) {
    if (typeof prefs === 'string' || prefs === null || prefs === undefined) {
      return;
    }
    Object.keys(prefs).forEach(key => {
      this.replaceDots(prefs[key]);
      if (key.includes('.')) {
        const newKey = key.split('.').join('--DOT--');
        prefs[newKey] = prefs[key];
        delete prefs[key];
      }
    });
  }

  public getPreferences(key: string) {
    return this.preferences[key];
  }

  public isReady() {
    return !!this.preferences;
  }

  private checkIfFirstTimeLoginAndSaveData(pref) {
    if (!pref.version) {
      this.setPreferences('version', 1);
      this.setPreferences(USER_PREFERENCES_KEY.firstLogin, true);
      window.localStorage.setItem(USER_PREFERENCES_KEY.firstLogin, '0');
    } else {
      const firstLoginTime = window.localStorage.getItem(USER_PREFERENCES_KEY.firstLogin) || new Date().getTime().toString();
      window.localStorage.setItem(USER_PREFERENCES_KEY.firstLogin, firstLoginTime);
    }
  }

  private migrateArrayPreferencesToObjects(pref) {
    if (Array.isArray(pref.experiments?.output?.settingsList)) {
      this.setPreferences('experiments.output.settingsList', pref.experiments?.output?.settingsList.reduce((acc, settingRow) => {
        const {id, ...withoutId} = settingRow;
        acc[settingRow.id] = withoutId;
        return acc;
      }, {}));
    }

    const pathsToMigrate = [
      'experiments.view.metricsCols',
      'datasets.metadataCols',
      'models.view.metadataCols',
      'models.view.metricsCols'
    ]

    pathsToMigrate.forEach((path) => {
      const oldData = get(pref, path);
      if (oldData && Array.isArray(oldData)) {
        this.setPreferences(path, oldData.reduce((acc, metricsCol) => {
          if (acc[metricsCol.projectId]) {
            acc[metricsCol.projectId].push(metricsCol);
          } else {
            acc[metricsCol.projectId] = [metricsCol];
          }
          return acc;
        }, {}));
      }
    })
  }

  private removeFromLocalStorage() {
    localStorage.removeItem(USER_PREFERENCES_STORAGE_KEY);
  }

  private saveToServer(partialPreferences: Record<string, any>) {
    this.userService.usersSetPreferences({preferences: partialPreferences, return_updated: false} as UsersSetPreferencesRequest).subscribe(() => {
    });
  }

  private cleanPreferencesInPreferences(pref: Record<string, any>) {
    if (pref.preferences) {
      this.setPreferences('preferences', null);
    }
  }
}
