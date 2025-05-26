import {Component, ElementRef, Renderer2, TemplateRef, input, inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogConfig} from './confirm-dialog.model';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import { NgTemplateOutlet } from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'sm-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    imports: [
        DialogTemplateComponent,
        MatCheckboxModule,
        FormsModule,
        NgTemplateOutlet,
        SaferPipe,
        MatButton
    ]
})
export class ConfirmDialogComponent {
  protected data = inject<ConfirmDialogConfig>(MAT_DIALOG_DATA);
  protected dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef<ConfirmDialogComponent>);
  private renderer = inject(Renderer2);
  private ref = inject(ElementRef);

  showNeverShowAgain: boolean;
  title: string;
  body?: string;
  template?: TemplateRef<unknown>;
  templateContext: unknown;
  yes = 'OK';
  no = 'Cancel';
  iconClass = '';
  iconData = '';
  codeSnippet = '';
  public reference: string;
  neverShowAgain: boolean;
  centerText: boolean;

  displayX = input(true);

  constructor() {
    this.title = this.data.title || '';
    this.reference = this.data.reference || '';
    this.body = this.data.body || '';
    this.template = this.data.template;
    this.templateContext = this.data.templateContext;
    this.yes = this.data.yes || '';
    this.no = typeof this.data.no === 'string' && this.data?.no ? this.data.no : '';
    this.iconClass = this.data.iconClass || '';
    this.iconData = this.data.iconData || '';
    this.codeSnippet = this.data.codeSnippet || '';
    this.showNeverShowAgain = this.data.showNeverShowAgain || false;
    this.centerText = this.data.centerText ?? false;
    const width = this.data.width || 640;

    this.renderer.setStyle(this.ref.nativeElement, 'width', `${width}px`);
  }

  closeDialog(isConfirmed) {
    if (isConfirmed) {
      this.dialogRef.close({isConfirmed, neverShowAgain: this.neverShowAgain});
    } else {
      this.dialogRef.close(isConfirmed);
    }
  }
}
