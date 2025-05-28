import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {GroupedCheckedFilterListComponent, HyperParams} from '@common/shared/ui-components/data/grouped-checked-filter-list/grouped-checked-filter-list.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
    selector: 'sm-select-hyper-params-for-custom-col',
    templateUrl: './select-hyper-params-for-custom-col.component.html',
    styleUrls: ['./select-hyper-params-for-custom-col.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        GroupedCheckedFilterListComponent,
        ClickStopPropagationDirective
    ]
})
export class SelectHyperParamsForCustomColComponent {

  public metricsCols: string[];

  @Input() hyperParams: Record<string, HyperParams<{ checked: boolean; value: string }>>;
  @Output() getMetricsToDisplay      = new EventEmitter();
  @Output() selectedHyperParamToShow = new EventEmitter<{param: string; addCol: boolean}>();
  @Output() goBack                   = new EventEmitter();
  @Output() clearSelection           = new EventEmitter();

  @Input() set tableCols(tableCols) {
    this.metricsCols = tableCols;
  }


  public toggleParamToDisplay({param, value}) {
    this.selectedHyperParamToShow.emit({param: `hyperparams.${param}`, addCol: !value});
  }

}
