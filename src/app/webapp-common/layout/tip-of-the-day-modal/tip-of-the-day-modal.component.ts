import {ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {addMessage} from '../../core/actions/layout.actions';
import {Tip} from '../../shared/services/tips.service';
import {MESSAGES_SEVERITY} from '@common/constants';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatCheckbox} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';

export interface TipsModalData {
  tips: Tip[];
  visitedIndex: number;
  hideDontShow: boolean;
  darkTheme: boolean;
}


@Component({
    selector: 'sm-tip-of-the-day-modal',
    templateUrl: './tip-of-the-day-modal.component.html',
    styleUrls: ['./tip-of-the-day-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DialogTemplateComponent,
        ClickStopPropagationDirective,
        SaferPipe,
        TooltipDirective,
        MatCheckbox,
        FormsModule
    ]
})
export class TipOfTheDayModalComponent {
  public matDialogRef = inject<MatDialogRef<TipOfTheDayModalComponent>>(MatDialogRef<TipOfTheDayModalComponent>);
  private store = inject(Store);
  protected data = inject<TipsModalData>(MAT_DIALOG_DATA);

  public tips = signal<Tip[]>(this.data.tips);
  private visitedIndex = signal(this.data.visitedIndex % this.tips().length);
  public hideDontShow = signal<boolean>(this.data.hideDontShow);
  public tipIndex = signal(this.visitedIndex());
  neverShowAgain = signal(false);

  constructor() {
    this.saveIndexInLocalstorage();
    this.matDialogRef.beforeClosed().subscribe(res => this.neverShowAgain() && !res ? this.matDialogRef.close(this.neverShowAgain()) : false);
  }

  copyToClipboardSuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'URL copied successfully'));
  }

  prev() {
    this.tipIndex.set((this.tips().length + this.tipIndex() - 1) % this.tips().length);
  }

  next() {
    this.tipIndex.set((this.tipIndex() + 1) % this.tips().length);
    this.saveIndexInLocalstorage();
  }

  private saveIndexInLocalstorage() {
    if (this.visitedIndex() <= this.tipIndex()) {
      this.visitedIndex.set(this.tipIndex() + 1);
      window.localStorage.setItem('tipVisitedIndex', `${this.visitedIndex()}`);
    }
  }

  getThemeImageSrc(src: string) {
    if (this.data.darkTheme) {
      return src;
    }
    try {
      const parts = src.split('.');
      parts[parts.length - 2] = parts.at(-2) + '-light';
      return parts.join('.');
    } catch {
      return src
    }
  }
}
