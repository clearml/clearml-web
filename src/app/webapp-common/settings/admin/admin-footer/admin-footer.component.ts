import { Component, OnInit } from '@angular/core';
import {selectServerVersions} from '@common/core/reducers/users-reducer';
import {Store} from '@ngrx/store';
import version from '../../../../../version.json';
import {getApiVersion} from '@common/core/actions/users.actions';

@Component({
    selector: 'sm-admin-footer',
    templateUrl: './admin-footer.component.html',
    styleUrls: ['./admin-footer.component.scss'],
    standalone: false
})
export class AdminFooterComponent implements OnInit {

  public serverVersions$ = this.store.select(selectServerVersions);
  public version = version;

  constructor(private store: Store) {
    store.dispatch(getApiVersion());
  }

  ngOnInit(): void {
  }

}
