import {Component} from '@angular/core';

@Component({
    selector: 'sm-ui-update-dialog',
    templateUrl: './ui-update-dialog.component.html',
    styleUrls: ['./ui-update-dialog.component.scss'],
    standalone: false
})
export class UiUpdateDialogComponent {

  reload() {
    window.location.reload();
  }
}
