import {Component, HostListener, inject, viewChild, computed, ChangeDetectionStrategy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {addMessage, saveAceCaretPosition} from '@common/core/actions/layout.actions';
import {selectAceCaretPosition} from '@common/core/reducers/view.reducer';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {orderJson} from '@common/shared/utils/shared-utils';
import {MatButton} from '@angular/material/button';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';

export interface EditJsonData {
  textData?: string | object;
  readOnly?: boolean;
  title: string;
  subtitle?: string;
  format?: 'json' | 'yaml' | 'hocon';
  placeHolder?: string;
  reorder?: boolean;
}

@Component({
  selector: 'sm-edit-json',
  templateUrl: './edit-json.component.html',
  styleUrls: ['./edit-json.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    MatDialogActions,
    MatButton,
    CodeEditorComponent
  ]
})
export class EditJsonComponent {
  protected data = inject<EditJsonData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<EditJsonComponent, string | null>>(MatDialogRef<EditJsonComponent, string | null>);
  private store = inject(Store);
  protected errors: Map<string, boolean>;
  protected textData: string;
  protected showErrors: boolean;

  private _readOnly: boolean;
  protected placeHolder: string;
  protected readOnly = this.data.readOnly;
  protected title = this.data.title;
  protected subtitle = this.data.subtitle;
  protected readonly typeJson: boolean = this.data.format === 'json';
  private readonly format?: 'json' | 'yaml' | 'hocon' = this.data.format;
  protected mode: string;

  protected editor = viewChild(CodeEditorComponent);
  protected aceCaretPosition = this.store.selectSignal(selectAceCaretPosition);
  protected position = computed(() => this.aceCaretPosition()?.[this.title] ?? null)

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && e.ctrlKey === true) {
      this.closeDialog(!this.readOnly);
    }
  }

  constructor() {
    let defaultPlaceHolder: string;
    if (this.typeJson) {
      defaultPlaceHolder = `e.g.:

{
  "location" : "london",
  "date" : "2019-01-31 22:41:03"
}`;
    } else {
      defaultPlaceHolder = '';
    }
    this.placeHolder = this.data.placeHolder ?? defaultPlaceHolder;

    if (!this.data.textData) {
      this.textData = undefined;
    } else if (this.typeJson && typeof this.data.textData !== 'string') {
      if (this.data.reorder) {
        this.textData = JSON.stringify(orderJson(this.data.textData), null, 2);
      } else {
        this.textData = JSON.stringify(this.data.textData, null, 2);
      }
    } else {
      this.textData = this.data.textData as string;
    }

    switch (this.format) {
      case 'hocon':
        this.mode = 'ini';
        break;
      case 'json':
        this.mode = 'json';
        break;
      case 'yaml':
        this.mode = 'yaml';
        break;
      default:
        this.mode = 'text';
    }
  }

  closeDialog(isConfirmed) {
    this.store.dispatch(saveAceCaretPosition({id: this.title, position: this.editor().getEditor().selection.getCursor()}));
    if (isConfirmed) {
      try {
        const text = this.editor().aceCode;
        this.textData = text;
        this.dialogRef.close(text ? (this.typeJson ? JSON.parse(text) : text) : '');
      } catch {
        this.store.dispatch(addMessage('warn', 'Not a valid JSON'));
        // this.showErrors = true; // shows warning message bellow texterea
      }
    } else {
      this.dialogRef.close();
    }
  }
}
