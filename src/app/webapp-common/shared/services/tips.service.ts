import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material/dialog';
import {selectRouterConfig} from '../../core/reducers/router-reducer';
import {combineLatest, of} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, withLatestFrom} from 'rxjs/operators';
import {
  TipOfTheDayModalComponent,
  TipsModalData
} from '../../layout/tip-of-the-day-modal/tip-of-the-day-modal.component';
import {selectDarkTheme, selectFirstLogin, selectNeverShowPopups} from '../../core/reducers/view.reducer';
import {selectCurrentUser} from '../../core/reducers/users-reducer';
import {neverShowPopupAgain} from '../../core/actions/layout.actions';
import {FeaturesEnum} from '~/business-logic/model/users/featuresEnum';
import {selectFeatures, selectTermsOfUse} from '~/core/reducers/users.reducer';
import {DeviceDetectorService} from 'ngx-device-detector';
import {ConfigurationService} from '@common/shared/services/configuration.service';

type Tips = Record<string, Tip[]>;

export interface Tip {
  title: string;
  image: string;
  content: string;
  context?: string;
  feature?: FeaturesEnum;
}

const tipsCooldownTime = 1000 * 60 * 60 * 24 * 3;
export const popupId = 'tip-of-the-day';

@Injectable({
  providedIn: 'root'
})
export class TipsService {
  private httpClient = inject(HttpClient);
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  private deviceService = inject(DeviceDetectorService);

  private tipsConfig = signal<Tips>({global: []});
  private nextTimeToShowTips: Date;
  private neverShowAgain: boolean;
  private firstTime = true;
  private mobile = this.deviceService.isMobile();
  public hasTips = computed(() => Object.keys(this.tipsConfig()).length > 0);
  protected darkTheme = this.store.selectSignal(selectDarkTheme);

  constructor(
  ) {
    combineLatest([
      this.store.select(selectRouterConfig),
      this.store.select(selectCurrentUser),
      this.store.select(selectFirstLogin),
      this.store.select(selectTermsOfUse)
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(1000),
        filter(([, user, firstLogin, tos]) => !this.mobile && !firstLogin && !!user && !tos?.accept_required && !this.neverShowAgain && this.matDialog.openDialogs.length === 0),
        distinctUntilChanged(([prev], [curr]) => prev?.[prev.length - 1] === curr?.[curr?.length - 1]))
      .subscribe(([routerConfig]) => {
        const urlConfig = routerConfig?.join('/');
        if (this.tipsConfig()?.['global'].length || this.tipsConfig()?.[urlConfig]) {
          const allTips = [...this.tipsConfig()['global']];
          if (this.tipsConfig()[urlConfig]) {
            allTips.concat(this.tipsConfig()[urlConfig]);
          }
          if (this.shouldDisplayTips()) {
            this.showTipsModal(allTips);
          }
        }
      });

    this.store.select(selectNeverShowPopups)
      .pipe(
        takeUntilDestroyed(),
        map((neverShowAgain) => neverShowAgain.includes(popupId)),
        distinctUntilChanged()
      )
      .subscribe(neverShowAgain => {
        this.neverShowAgain = neverShowAgain;
        if (!this.firstTime) {
          if (!neverShowAgain) {
            this.nextTimeToShowTips = new Date();
            window.localStorage.removeItem('nextTimeToShowTips');
          }
        }
        this.firstTime = false;
      });
  }

  initTipsService(showAllTips = true) {
    this.nextTimeToShowTips = new Date(window.localStorage.getItem('nextTimeToShowTips') || new Date().getTime());

    this.httpClient.get('onboarding.json')
      .pipe(
        filter((tipsConfig: { onboarding: Tip[] }) => !!tipsConfig?.onboarding && ConfigurationService.globalEnvironment.displayTips !== false),
        withLatestFrom(this.store.select(selectFeatures)),
        catchError(() => of([{}, []]))
      )
      .subscribe(([tipsConfig, features]: [{ onboarding: Tip[] }, FeaturesEnum[]]) => {
        const tipsFiltered = tipsConfig.onboarding?.filter(tip => !tip.feature || !features || features.includes(tip.feature) || showAllTips) ?? [];
        this.tipsConfig.set({
          global: [], ...tipsFiltered.reduce((acc, curr) => {
            const context = curr.context || 'global';
            if (acc[context]) {
              acc[context].push(curr);
            } else {
              acc[context] = [curr];
            }
            return acc;
          }, {} as Tips)
        });
      });
  }

  public showTipsModal(allTips?: Tip[], hideDontShow?: boolean) {
    const visitedIndex = parseInt(window.localStorage.getItem('tipVisitedIndex'), 10) || 0;
    allTips = allTips ? allTips : (Object.values(this.tipsConfig())).flat();
    this.matDialog.open<TipOfTheDayModalComponent, TipsModalData, boolean>(TipOfTheDayModalComponent, {
      data: {
        tips: allTips,
        visitedIndex,
        hideDontShow: this.neverShowAgain || hideDontShow,
        darkTheme: this.darkTheme()
      },
      maxWidth: '712px'
    }).afterClosed()
      .subscribe((neveShowAgain) => {
        if (neveShowAgain) {
          this.store.dispatch(neverShowPopupAgain({popupId}));
        }
        this.nextTimeToShowTips = new Date(new Date().getTime() + tipsCooldownTime);
        window.localStorage.setItem('nextTimeToShowTips', this.nextTimeToShowTips.toISOString());
      });
  }

  private shouldDisplayTips() {
    return this.nextTimeToShowTips <= new Date();
  }
}
