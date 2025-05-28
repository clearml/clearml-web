import {ChangeDetectionStrategy, Component, signal, input } from '@angular/core';

import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
    selector: 'sm-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ClickStopPropagationDirective
    ]
})
export class CardComponent {

  header = input<string>();
  height = input<number>();

  // TODO: delete the following:
  collapsed = input(false);
  collapsible = input(false);
  fixedSize = input(false);
  overflowVisible = input(false);
  cardSign = input('');
  showSeparator = input(true);
  whiteHeader = input(false);
  whiterHeader = input(false);
  isExample = input(false);
  showFolder = input(false);
  subFolderTitle = input('');
  oneTabMode = input<boolean>();
  ribbonText = input<string>();


  public activeTab = signal(1);
  public secondTabIsHovered: boolean;
  public highlightFirstTab: boolean;
}
