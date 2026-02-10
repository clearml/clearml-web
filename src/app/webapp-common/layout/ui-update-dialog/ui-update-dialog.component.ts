import {ChangeDetectionStrategy, Component} from '@angular/core';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'sm-ui-update-dialog',
  templateUrl: './ui-update-dialog.component.html',
  styleUrls: ['./ui-update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    MatDialogClose,
    MatButton,
    MatDialogActions
  ]
})
export class UiUpdateDialogComponent {
  reload() {
    window.location.reload();
  }
}
