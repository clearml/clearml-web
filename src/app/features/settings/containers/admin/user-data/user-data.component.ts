import {Component, input} from '@angular/core';

@Component({
  selector: 'sm-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.scss'],
})
export class UserDataComponent {

  public userId = input<string>();
}
