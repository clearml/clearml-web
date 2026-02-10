import {Component, input, output } from '@angular/core';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-experiment-settings',
  templateUrl: './experiment-settings.html',
  styleUrls: ['./experiment-settings.scss'],
  imports: [
    TooltipDirective,
    MatIconModule,
    MatIconButton
  ]
})
export class ExperimentSettingsComponent {

  disabled = input(false);
  showSettings = input(false);
  tableView = input(false);
  toggleSettings = output();
}

