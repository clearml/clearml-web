import {Component, EventEmitter, Input, Output} from '@angular/core';

import {last} from 'lodash-es';
import {ClipboardModule} from 'ngx-clipboard';
import {Store} from '@ngrx/store';
import {addMessage} from '@common/core/actions/layout.actions';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MESSAGES_SEVERITY} from '@common/constants';

@Component({
    selector: 'sm-snippet-error',
    templateUrl: './snippet-error.component.html',
    styleUrls: ['./snippet-error.component.scss'],
    imports: [
        ClipboardModule,
        TooltipDirective,
        ShowTooltipIfEllipsisDirective
    ]
})
export class SnippetErrorComponent {
  private _copyContent: string;
  public baseFile: string;
  public floor = Math.floor;
  public min = Math.min;
  public missingSource = false;

  constructor(private store: Store) {}

  @Output() openImageClicked = new EventEmitter();
  @Input() set copyContent(content: string) {
    this.missingSource = !content;
    this._copyContent = content;
    this.baseFile = last(content?.split('/') || '');
  }
  get copyContent() {
    return this._copyContent;
  }

  @Input() height = 100;


  copyToClipboardSuccess(success: boolean) {
    this.store.dispatch(addMessage(success ? MESSAGES_SEVERITY.SUCCESS : MESSAGES_SEVERITY.ERROR, success ? 'Path copied to clipboard' : 'No path to copy'));
  }

}
