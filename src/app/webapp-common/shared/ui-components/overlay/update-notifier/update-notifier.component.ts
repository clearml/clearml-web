import {Component, EventEmitter, Input, Output, signal} from '@angular/core';
import {User} from '~/business-logic/model/users/user';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';


@Component({
    selector: 'sm-update-notifier',
    templateUrl: './update-notifier.component.html',
    styleUrls: ['./update-notifier.component.scss'],
    imports: [
        MatIconButton,
        MatIcon
    ]
})
export class UpdateNotifierComponent {
  public active      = signal(false);
  areAvailableUpdates = false;
  private _availableUpdates: any;
  public newVersionUrl: string;
  public newVersionName: string;

  @Input() dismissedVersion: string;

  @Input() set availableUpdates(availableUpdates) {
    this.areAvailableUpdates = availableUpdates?.['trains-server']?.['newer_available'];
    this.newVersionUrl       = availableUpdates?.['trains-server']?.['url'];
    this.newVersionName      = availableUpdates?.['trains-server']?.['version'];
    this._availableUpdates   = availableUpdates;
    if (this.areAvailableUpdates && this.dismissedVersion !== this.newVersionName) {
      this.active.set(true);
      this.notifierActive.emit(true);
    }
  }

  @Input() set currentUser(user: User) {
    if (user && user.role == 'guest') {
      this.areAvailableUpdates = false;
      this.active.set(false);
      this.notifierActive.emit(false);
    } else {
      this.areAvailableUpdates = this._availableUpdates?.['trains-server']?.['newer_available'];
      if (this.areAvailableUpdates && this.dismissedVersion !== this.newVersionName) {
        this.active.set(true);
        this.notifierActive.emit(true);
      }
    }
  }

  @Output() versionDismissed = new EventEmitter();
  @Output() notifierActive = new EventEmitter();

  get availableUpdates() {
    return this._availableUpdates;
  }

  dismiss() {
    this.active.set(false);
    this.notifierActive.emit(false);
    this.versionDismissed.emit(this.newVersionName);
  }

  show() {
    this.active.set(true);
    this.notifierActive.emit(true);
  }
}
