import {Component} from '@angular/core';
import {BaseExperimentOutputComponent} from '@common/experiments/containers/experiment-ouptut/base-experiment-output.component';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {GraphSettingsBarComponent} from '@common/shared/experiment-graphs/graph-settings-bar/graph-settings-bar.component';
import {ExperimentInfoNavbarComponent} from '~/features/experiments/containers/experiment-info-navbar/experiment-info-navbar.component';
import {InfoHeaderStatusIconLabelComponent} from '@common/shared/experiment-info-header-status-icon-label/info-header-status-icon-label.component';
import {ExperimentInfoHeaderComponent} from '@common/experiments/dumb/experiment-info-header/experiment-info-header.component';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {RouterOutlet} from '@angular/router';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';
import {MatIcon} from '@angular/material/icon';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'sm-experiment-output',
  templateUrl: './experiment-output.component.html',
  styleUrls: ['../../../../webapp-common/experiments/containers/experiment-ouptut/base-experiment-output.component.scss'],
  imports: [
    OverlayComponent,
    GraphSettingsBarComponent,
    ExperimentInfoNavbarComponent,
    InfoHeaderStatusIconLabelComponent,
    ExperimentInfoHeaderComponent,
    RefreshButtonComponent,
    RouterOutlet,
    MatMenu,
    MatIcon,
    MatIcon,
    PushPipe,
    MatMenuTrigger,
    TooltipDirective,
    MatIconButton,
    MatIconButton
  ]
})
export class ExperimentOutputComponent extends BaseExperimentOutputComponent {
}
