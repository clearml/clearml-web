import {Component, inject, output, input, computed, signal} from '@angular/core';
import {last} from 'lodash-es';
import {ClipboardModule} from 'ngx-clipboard';
import {Store} from '@ngrx/store';
import {NgxResize, ResizeResult} from 'ngxtension/resize';
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
    ShowTooltipIfEllipsisDirective,
    NgxResize
  ]
})
export class SnippetErrorComponent {

  private store = inject(Store);
  public floor = Math.floor;
  public min = Math.min;

  height = input(100);
  copyContent = input<string>(null);
  missingSource = computed(() => !this.copyContent());
  baseFile = computed(() => last(this.copyContent()?.split('/') || ''));

  openImageClicked = output();
  protected size = signal('');
  protected heightAboveLimit = signal(false);

  copyToClipboardSuccess(success: boolean) {
    this.store.dispatch(addMessage(success ? MESSAGES_SEVERITY.SUCCESS : MESSAGES_SEVERITY.ERROR, success ? 'Path copied to clipboard' : 'No path to copy'));
  }

  onResize($event: ResizeResult) {
    this.size.set(Math.min(Math.floor($event.height - 44), 64).toString() || '');
    this.heightAboveLimit.set($event.height > 50);
  }
}
