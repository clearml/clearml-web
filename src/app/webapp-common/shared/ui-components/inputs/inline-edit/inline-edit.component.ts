import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  input,
  output,
  viewChild,
  computed, inject, DestroyRef, signal
} from '@angular/core';
import {FormsModule, NgModel} from '@angular/forms';

import {
  UniqueNameValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'sm-inline-edit',
  templateUrl: './inline-edit.component.html',
  styleUrls: ['./inline-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'stopEditing()'
  },
  imports: [
    FormsModule,
    UniqueNameValidatorDirective,
    TooltipDirective,
    ClickStopPropagationDirective,
    MatIcon,
    MatIconButton,
  ]
})
export class InlineEditComponent {
  private renderer = inject(Renderer2);
  private readonly destroy = inject(DestroyRef);

  protected readonly cancelButton = 'CANCEL_BUTTON';
  public active = signal(false);
  protected inlineValue = signal<string>(null);

  readonly pattern = input(undefined);
  readonly required = input(false);
  readonly minLength = input(0);
  readonly originalText = input(undefined);
  forbiddenString = input<string[]>();
  forbiddenStringFiltered = computed(() => this.forbiddenString()?.filter(fs => fs !== this.originalText()));

  // *DEFAULTS*
  readonly editable = input(true);
  readonly fixedWidth = input(undefined);
  multiline = input(false);
  readonly rows = input(3); // Only relevant to multiline
  readonly inlineDisabled = input(false);
  warning = input<string>();

  readonly inlineActiveStateChanged = output<boolean>();
  readonly textChanged = output<string>();
  readonly inlineFocusOutEvent = output<boolean>();
  readonly cancelEdit = output();
  readonly cancelClick = output<Event>();

  inlineInput = viewChild<NgModel>('inlineInput');
  readonly inlineInputRef = viewChild('inlineInput', { read: ElementRef });
  template = viewChild<ElementRef<HTMLDivElement>>('template');

  stopEditing() {
    if (this.active()) {
      this.inlineCanceled();
    }
  }

  constructor() {
    this.destroy.onDestroy(() => {
      this.stopEditing();
    });
  }

  public inlineCanceled() {
    this.inlineValue.set(this.originalText());
    this.active.set(false);
    this.inlineActiveStateChanged.emit(false);
    this.cancelEdit.emit();
  }

  public inlineSaved() {
    this.inlineValue.set(this.inlineInput().value);
    if (this.inlineValue() !== this.originalText()) {
      this.textChanged.emit(this.inlineValue());
      this.active.set(false);
      this.inlineActiveStateChanged.emit(false);
    } else {
      this.inlineCanceled();
    }

  }

  public inlineActivated(event?: Event) {
    if (!this.editable()) {
      return;
    }

    if (!this.multiline()) {
      const templateWidth = this.fixedWidth() || Math.max(this.template().nativeElement.getBoundingClientRect().width - (this.multiline() ? 20 : 70), 200);
      this.renderer.setStyle(this.inlineInputRef().nativeElement, 'width', `${templateWidth}px`);
    }
    this.inlineValue.set(this.originalText());
    event?.stopPropagation();
    setTimeout(() => {
      this.inlineActiveStateChanged.emit(true);
      this.active.set(true);
    }, 50);
    setTimeout(() => {
      this.inlineInputRef().nativeElement.focus();
    }, 100);
  }

  cancelClicked(event: Event) {
    this.cancelClick.emit(event);
    this.inlineCanceled();
  }
}
