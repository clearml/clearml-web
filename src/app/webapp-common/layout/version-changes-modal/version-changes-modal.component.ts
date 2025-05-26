import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {addMessage} from '../../core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {FormsModule} from '@angular/forms';
import {Change} from '@common/shared/services/changes.service';
import {MatButton} from '@angular/material/button';

export interface ChangesModalData {
  changes: Change[];
  visitedIndex: number;
  mainTitle?: string;
}


@Component({
    selector: 'sm-version-changes-modal',
    templateUrl: './version-changes-modal.component.html',
    styleUrls: ['./version-changes-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DialogTemplateComponent,
        ClickStopPropagationDirective,
        SaferPipe,
        FormsModule,
        MatDialogActions,
        MatButton,
        MatDialogClose
    ]
})
export class VersionChangesModalComponent {
  protected matDialogRef = inject(MatDialogRef<VersionChangesModalComponent>);
  private store = inject(Store);
  private data = inject<ChangesModalData>(MAT_DIALOG_DATA)

  public changes = signal<Change[]>(this.data.changes);
  private visitedIndex = signal(0);
  public mainTitle = signal<string>(this.data.mainTitle);
  public changeIndex = signal(0);
  neverShowAgain: boolean;

  constructor() {
    this.visitedIndex.set(this.data.visitedIndex % this.changes().length);
    this.changeIndex.set(this.visitedIndex());
    this.saveIndexInLocalstorage();
    this.matDialogRef.beforeClosed().subscribe(res => this.neverShowAgain && !res ? this.matDialogRef.close(this.neverShowAgain) : false);
  }

  copyToClipboardSuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'URL copied successfully'));
  }

  prev() {
    this.changeIndex.set((this.changes().length + this.changeIndex() - 1) % this.changes().length);
  }

  next() {
    this.changeIndex.set((this.changeIndex() + 1) % this.changes().length);
    this.saveIndexInLocalstorage();
  }

  private saveIndexInLocalstorage() {
    if (this.visitedIndex() <= this.changeIndex()) {
      this.visitedIndex.set(this.changeIndex() + 1);
      // window.localStorage.setItem('tipVisitedIndex', `${this.visitedIndex()}`);
    }
  }
}
