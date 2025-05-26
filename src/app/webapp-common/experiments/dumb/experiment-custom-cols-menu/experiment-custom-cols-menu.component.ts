import {ChangeDetectionStrategy, Component, computed, EventEmitter, input, model, Output, TemplateRef} from '@angular/core';
import {CustomColumnMode} from '../../shared/common-experiments.const';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {CustomColumnsListComponent} from '@common/shared/components/custom-columns-list/custom-columns-list.component';
import {NgTemplateOutlet, UpperCasePipe} from '@angular/common';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'sm-custom-cols-menu',
    templateUrl: './experiment-custom-cols-menu.component.html',
    styleUrls: ['./experiment-custom-cols-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MenuComponent,
        CustomColumnsListComponent,
        NgTemplateOutlet,
        UpperCasePipe,
        MatProgressSpinner,
        MatIcon,
        MatButton
    ]
})
export class ExperimentCustomColsMenuComponent {

  sections = input<{title?: string; name: string; options: any[]; skipValue?: boolean; template: TemplateRef<any>}[]>();
  menuHeader = input<string>();
  topTitle = input<string>('CUSTOMIZE COLUMNS');
  menuTooltip = input<string>();
  sectionsTitle = input<string>();
  selectable = input<boolean>(true);
  tableCols = input<ISmCol[]>()
  disabled = input<boolean>();
  isLoading = input<boolean>();
  darkTheme = input<boolean>();
  customColumnMode = model(CustomColumnMode.Standard as CustomColumnMode);
  hasSecondSection = computed(() =>
    Object.values(this.sections()?.[1]?.options ?? {}).some(section =>  Object.keys(section).length > 0));

  @Output() getMetricsToDisplay = new EventEmitter();
  @Output() removeColFromList = new EventEmitter<ISmCol['id']>();
  @Output() selectedTableColsChanged = new EventEmitter<ISmCol>();

  public customColumnModeEnum = CustomColumnMode;

}
