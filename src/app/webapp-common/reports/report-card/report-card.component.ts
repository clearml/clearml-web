import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TIME_FORMAT_STRING} from '@common/constants';
import {IReport} from '../reports.consts';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {CleanProjectPathPipe} from '@common/shared/pipes/clean-project-path.pipe';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {DatePipe} from '@angular/common';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {ReportCardMenuComponent} from '@common/reports/report-card-menu/report-card-menu.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
    selector: 'sm-report-card',
    templateUrl: './report-card.component.html',
    styleUrls: ['./report-card.component.scss'],
    imports: [
        CardComponent,
        InlineEditComponent,
        TooltipDirective,
        CleanProjectPathPipe,
        ShowTooltipIfEllipsisDirective,
        ClickStopPropagationDirective,
        DatePipe,
        TimeAgoPipe,
        StatusIconLabelComponent,
        TagListComponent,
        ReportCardMenuComponent
    ]
})
export class ReportCardComponent {

  public isExample: boolean;
  private _report: IReport;
  @Input() projectsNames: string[];

  @Input() set report(data: IReport) {
    this._report = data;
    this.isExample = !['All Tasks'].includes(data.name) && (!data.company || ! data.company['id']);
  }
  get report() {
    return this._report;
  }

  @Input() allTags: string[];

  @Input() hideMenu = false;
  @Input() isArchive = false;
  @Output() cardClicked = new EventEmitter<IReport>();
  @Output() nameChanged = new EventEmitter();
  @Output() delete = new EventEmitter ();
  @Output() removeTag = new EventEmitter<string>();
  @Output() addTag = new EventEmitter<string>();
  @Output() archive = new EventEmitter<boolean>();
  @Output() moveTo = new EventEmitter<string>();
  @Output() share = new EventEmitter();
  timeFormatString = TIME_FORMAT_STRING;
}
