import {ChangeDetectionStrategy, Component, computed, effect, input, output, signal} from '@angular/core';
import {User} from '~/business-logic/model/users/user';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';


@Component({
  selector: 'sm-update-notifier',
  templateUrl: './update-notifier.component.html',
  styleUrls: ['./update-notifier.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatIcon
  ]
})
export class UpdateNotifierComponent {
  public active = signal(false);

  dismissedVersion = input<string>();
  availableUpdates = input<any>();
  currentUser = input<User>();

  versionDismissed = output<string>();
  notifierActive = output<boolean>();

  areAvailableUpdates = computed(() => {
    const user = this.currentUser();
    const updates = this.availableUpdates();
    if (user?.role === 'guest') {
      return false;
    }
    return !!updates?.['trains-server']?.['newer_available'];
  });

  newVersionUrl = computed(() => this.availableUpdates()?.['trains-server']?.['url']);
  newVersionName = computed(() => this.availableUpdates()?.['trains-server']?.['version']);

  constructor() {
    effect(() => {
      const areAvailable = this.areAvailableUpdates();
      const newVersion = this.newVersionName();
      const dismissed = this.dismissedVersion();

      if (areAvailable && dismissed !== newVersion) {
        this.active.set(true);
        this.notifierActive.emit(true);
      } else {
        this.active.set(false);
        this.notifierActive.emit(false);
      }
    });
  }

  dismiss() {
    this.active.set(false);
    this.notifierActive.emit(false);
    this.versionDismissed.emit(this.newVersionName());
  }

  show() {
    this.active.set(true);
    this.notifierActive.emit(true);
  }
}
