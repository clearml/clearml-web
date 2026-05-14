import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material/dialog';
import {selectRouterConfig} from '../../core/reducers/router-reducer';
import {combineLatest, of} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, withLatestFrom} from 'rxjs/operators';
import {selectFirstLogin, selectNeverShowAppChanges} from '../../core/reducers/view.reducer';
import {selectCurrentUser, selectIsAdmin} from '../../core/reducers/users-reducer';
import {neverShowChangesAgain} from '../../core/actions/layout.actions';
import {selectFeatures} from '~/core/reducers/users.reducer';
import {DeviceDetectorService} from 'ngx-device-detector';
import {default as semverGte} from 'semver/functions/gte';
import {default as semverGt} from 'semver/functions/gt';
import {FeaturesEnum} from '~/business-logic/model/users/featuresEnum';
import {ChangesModalData, VersionChangesModalComponent} from '@common/layout/version-changes-modal/version-changes-modal.component';

export interface Change {
  version: string;
  content: string;
  context?: string;
  image: string;
  title: string;
  feature?: FeaturesEnum;
}

const changesCooldownTime = 1000 * 60 * 60 * 2;
export const localStorageKey = 'nextTimeToShowChanges';

@Injectable({
  providedIn: 'root'
})
export class ChangesService {
  private httpClient = inject(HttpClient);
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  private deviceService = inject(DeviceDetectorService);

  private currentUser = this.store.selectSignal(selectCurrentUser);

  private changesConfig = signal<Change[]>([]);
  private nextTimeToShowChanges: Date;
  private neverShowAgainForVersion: boolean;
  private firstTime = true;
  private mobile = this.deviceService.isMobile();
  public hasChanges = computed(() => this.changesConfig()?.length > 0);

  constructor() {
    combineLatest([
      this.store.select(selectRouterConfig),
      this.store.select(selectCurrentUser),
      this.store.select(selectFirstLogin),
      this.store.select(selectIsAdmin)
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(1000),
        filter(([, user, firstLogin, isAdmin]) =>
          isAdmin && !this.mobile && !firstLogin && !!user && !this.neverShowAgainForVersion && this.matDialog.openDialogs.length === 0),
        distinctUntilChanged(([prev], [curr]) => prev?.[prev.length - 1] === curr?.[curr.length - 1]))
      .subscribe(() => {
        if (this.shouldDisplayChanges() && this.changesConfig()?.length > 0) {
          this.showChangesModal();
        }
      });
  }

  initChangesService() {
    this.nextTimeToShowChanges = new Date(window.localStorage.getItem(localStorageKey) || new Date().getTime());

    this.httpClient.get('server_changes.json')
      .pipe(
        withLatestFrom(this.store.select(selectFeatures)),
        map(([changesConfig, features]: [{ changes: Change[] }, FeaturesEnum[]]) => ({
          changes: changesConfig.changes.filter(change => !change.feature || !features || features.includes(change.feature) &&
            semverGt(change.version ?? '0.0.0', this.currentUser().created_in_version || '0.0.0'))
        })),
        filter((changesConfig: { changes: Change[] }) => changesConfig?.changes?.length > 0),
        catchError(() => of({changes: []})),
        withLatestFrom(this.store.select(selectNeverShowAppChanges))
      )
      .subscribe(([changes, lastApprovedVersion]: [{ changes: Change[] }, string]) => {
        this.changesConfig.set(changes.changes);
        this.neverShowAgainForVersion = semverGte(lastApprovedVersion || '0.0.0', this.changesConfig()?.[0]?.version ?? '0.0.0') ||
          semverGte(this.currentUser().created_in_version || '0.0.0', this.changesConfig()?.[0]?.version ?? '0.0.0');

        if (!this.firstTime) {
          if (!this.neverShowAgainForVersion) {
            this.nextTimeToShowChanges = new Date();
            window.localStorage.removeItem(localStorageKey);
          }
        }
        this.firstTime = false;
      });
  }

  public showChangesModal() {
    this.matDialog.open<VersionChangesModalComponent, ChangesModalData, boolean>(VersionChangesModalComponent, {
      data: {
        changes: this.changesConfig(),
        visitedIndex: 0,
        mainTitle: `IMPORTANT CHANGES IN v${this.changesConfig()[0].version}`
      },
      maxWidth: '540px'
    }).afterClosed()
      .subscribe((neveShowAgain) => {
        if (neveShowAgain) {
          this.store.dispatch(neverShowChangesAgain({version: this.changesConfig()[0].version}));
        }
        this.nextTimeToShowChanges = new Date(new Date().getTime() + changesCooldownTime);
        window.localStorage.setItem(localStorageKey, this.nextTimeToShowChanges.toISOString());

      });
  }

  private shouldDisplayChanges() {
    return this.nextTimeToShowChanges <= new Date();
  }
}
