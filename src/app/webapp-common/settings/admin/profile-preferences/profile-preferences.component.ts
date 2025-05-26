import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatSlideToggle, MatSlideToggleChange} from '@angular/material/slide-toggle';
import {neverShowPopupAgain, setHideEnterpriseFeatures, setHideRedactedArguments} from '@common/core/actions/layout.actions';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {Store} from '@ngrx/store';
import {popupId, TipsService} from '@common/shared/services/tips.service';
import {
  selectHideEnterpriseFeatures,
  selectHideRedactedArguments,
  selectNeverShowPopups
} from '@common/core/reducers/view.reducer';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {AuthEditUserRequest} from '~/business-logic/model/auth/authEditUserRequest';
import {MatDialog} from '@angular/material/dialog';
import {RedactedArgumentsDialogComponent} from '../redacted-arguments-dialog/redacted-arguments-dialog.component';
import {selectBlockUserScript, selectHideExamples, selectShowHiddenUserSelection} from '@common/core/reducers/projects.reducer';
import {setBlockUserScript, setHideExamples, setShowHidden} from '@common/core/actions/projects.actions';
import RoleEnum = AuthEditUserRequest.RoleEnum;
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {UsageStatsComponent} from '~/features/settings/containers/admin/usage-stats/usage-stats.component';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-profile-preferences',
    templateUrl: './profile-preferences.component.html',
    styleUrls: ['./profile-preferences.component.scss'],
    imports: [
        MatSlideToggle,
        TooltipDirective,
        UsageStatsComponent,
        MatButton,
        MatIcon
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePreferencesComponent {

  private store = inject(Store);
  private dialog = inject(MatDialog);
  protected config = inject(ConfigurationService);
  protected tipsService = inject(TipsService);
  protected supportReScaling = window['chrome'] || window['safari'];
  protected disableHidpiChanged= false;
  protected popupId = popupId;
  protected disableHidpi = window.localStorage.getItem('disableHidpi') === 'true';
  protected neverShowTipsAgain = this.store.selectSignal(selectNeverShowPopups);
  protected blockUserScripts = this.store.selectSignal(selectBlockUserScript);
  protected hideEnterpriseFeatures = this.store.selectSignal(selectHideEnterpriseFeatures);
  protected show = this.store.selectSignal(selectShowHiddenUserSelection);
  protected admin = computed(() => this.currentUser()?.role === RoleEnum.Admin);
  protected hideRedactedArguments = this.store.selectSignal(selectHideRedactedArguments);
  protected hideExamples= this.store.selectSignal(selectHideExamples);
  private currentUser= this.store.selectSignal(selectCurrentUser);

  hidpiChange(event: MatSlideToggleChange) {
    window.localStorage.setItem('disableHidpi', JSON.stringify(event.checked));
    this.disableHidpiChanged = !this.disableHidpiChanged;
  }

  reload(event) {
    if (this.disableHidpiChanged) {
      event.stopPropagation();
      event.preventDefault();
      window.location.reload();
    }
  }

  setNeverShowTipsAgain($event: MatSlideToggleChange) {
    this.store.dispatch(neverShowPopupAgain({popupId, reset: !$event.checked}));
  }

  statsChange(toggle: MatSlideToggleChange) {
    this.store.dispatch(setShowHidden({show: toggle.checked}));
  }

  hideSpecificContainerArguments(toggle: MatSlideToggleChange) {
    this.store.dispatch(setHideRedactedArguments({hide: toggle.checked}));
  }

  editHideSpecificContainerArguments() {
    this.dialog.open(RedactedArgumentsDialogComponent);
  }

  toggleExamples(toggle: MatSlideToggleChange) {
    this.store.dispatch(setHideExamples({hide: toggle.checked}));
  }

  toggleBlockUserScript(toggle: MatSlideToggleChange) {
    this.store.dispatch(setBlockUserScript({block: toggle.checked}));
  }

  toggleEnterpriseFeatures(hide: boolean) {
    this.store.dispatch(setHideEnterpriseFeatures({hide}));
  }
}
