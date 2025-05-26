import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ICONS} from '@common/constants';
import {IReport} from '../reports.consts';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {MatMenuModule} from '@angular/material/menu';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIcon} from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
    selector: 'sm-report-card-menu',
    templateUrl: './report-card-menu.component.html',
    styleUrls: ['./report-card-menu.component.scss'],
    imports: [
        MatMenuModule,
        TagsMenuComponent,
        ClickStopPropagationDirective,
        MatIconButton,
        MatIcon
    ]
})
export class ReportCardMenuComponent {
  readonly icons = ICONS;
  private _report: IReport;
  public isExample: boolean;

  @Input() set report(report: IReport) {
    this._report = report;
    this.isExample = isReadOnly(report);
  }

  get report() {
    return this._report;
  }
  @Input() allTags: string[];
  @Input() isArchived: boolean;
  @Output() addTag = new EventEmitter<string>();
  @Output() rename = new EventEmitter();
  @Output() archive = new EventEmitter<boolean>();
  @Output() delete = new EventEmitter();
  @Output() moveTo = new EventEmitter();
  @Output() share = new EventEmitter();
}
