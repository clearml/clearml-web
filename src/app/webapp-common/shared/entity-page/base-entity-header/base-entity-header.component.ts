import {Component, inject, input, output } from '@angular/core';
import {BreakpointObserver} from '@angular/cdk/layout';
import {Store} from '@ngrx/store';
import {selectMaxDownloadItems} from '@common/core/reducers/users-reducer';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

@Component({
  selector: 'sm-base-entity-header',
  template: '',
})
export class BaseEntityHeaderComponent {
  private breakpointObserver = inject(BreakpointObserver)
  private store = inject(Store)

  noData = input<boolean>();
  entityType = input<EntityTypeEnum>();
  downloadTableAsCSV = output();
  downloadFullTableAsCSV = output();

  protected isSmallScreen$ = this.breakpointObserver.observe('(max-width: 1100px)');
  protected maxDownloadItems$ = this.store.select(selectMaxDownloadItems);
}
