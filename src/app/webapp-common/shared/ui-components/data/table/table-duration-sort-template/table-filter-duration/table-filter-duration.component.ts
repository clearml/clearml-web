import {ChangeDetectionStrategy, Component} from '@angular/core';
import {DurationParameters, TableDurationSortBaseComponent} from '../table-duration-sort-base.component';
import {isNil} from 'lodash-es';
import {
  DurationInputListComponent
} from '@common/shared/ui-components/inputs/duraion-input-list/duration-input-list.component';

import {
  TableFilterDurationErrorComponent
} from '@common/shared/ui-components/data/table/table-duration-sort-template/table-filter-duration-error/table-filter-duration-error.component';
import {FormsModule} from '@angular/forms';
import {DividerComponent} from '@common/shared/ui-components/indicators/divider/divider.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {
  KeydownStopPropagationDirective
} from '@common/shared/ui-components/directives/keydown-stop-propagation.directive';

@Component({
    selector: 'sm-table-filter-duration',
    templateUrl: './table-filter-duration.component.html',
    styleUrls: ['./table-filter-duration.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DurationInputListComponent,
        TableFilterDurationErrorComponent,
        FormsModule,
        DividerComponent,
        ClickStopPropagationDirective,
        KeydownStopPropagationDirective
    ]
})
export class TableFilterDurationComponent extends TableDurationSortBaseComponent {

  _updateValue(): void {
  }

  parseServerDataFunction(data): number {
    return +data;
  }

  prepareDataToServerFunction(data): number {
    return isNil(data) || data === '' ? null : +data ;
  }

  override timeStampChanged(value: number, name: DurationParameters) {
    if (this[name].checked !== !!value) {
      this.setCheckBox(!!value, name, false);
    }
    super.timeStampChanged(value, name);
  }

}
