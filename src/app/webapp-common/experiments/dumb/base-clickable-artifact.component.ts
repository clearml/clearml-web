import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {filter, map, take} from 'rxjs/operators';
import {selectSignedUrl} from '../../core/reducers/common-auth-reducer';
import {AdminService} from '~/shared/services/admin.service';
import {getSignedUrl} from '../../core/actions/common-auth.actions';
import {downloadArtifacts} from '@common/experiments/actions/common-experiments-info.actions';

@Component({
    selector: 'sm-base-clickable-artifact',
    template: '<div></div>',
    standalone: false
})
export class BaseClickableArtifactComponent {
  protected timestamp: number;
  protected adminService: AdminService;
  protected store: Store;

  constructor() {
    this.adminService = inject(AdminService);
    this.store = inject(Store);
  }

  artifactFilePathClicked(url: string, inMemory = false) {
    this.signUrl(url)
      .subscribe(signedUrl => this.store.dispatch(downloadArtifacts({url: signedUrl, inMemory})));
  }

  protected signUrl(url: string) {
    this.store.dispatch(getSignedUrl({url, config: {disableCache: this.timestamp}}));
    return this.store.select(selectSignedUrl(url))
      .pipe(
        map((res => res?.signed)),
        filter(signedUrl => !!signedUrl),
        take(1)
      );
  }
}
