import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  output,
  Output,
  signal,
  viewChild
} from '@angular/core';
import {
  LMarkdownEditorModule,
  MarkdownEditorComponent as MDComponent,
  MdEditorOption,
  UploadResult
} from 'ngx-markdown-editor';
import {Ace} from 'ace-builds';
import {MatDialog} from '@angular/material/dialog';
import {
  MarkdownCheatSheetDialogComponent
} from '@common/shared/components/markdown-editor/markdown-cheat-sheet-dialog/markdown-cheat-sheet-dialog.component';
import {getBaseName} from '@common/shared/utils/shared-utils';
import {marked} from 'marked';
import DOMPurify from 'dompurify';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {FormsModule} from '@angular/forms';
import {MatMenuModule} from '@angular/material/menu';
import {BaseNamePipe} from '@common/shared/pipes/base-name.pipe';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {ReportCodeEmbedBaseService} from '@common/shared/services/report-code-embed-base.service';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {selectThemeMode} from '@common/core/reducers/view.reducer';
import {Store} from '@ngrx/store';

const BREAK_POINT = 990;


@Component({
  selector: 'sm-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
    '[style.--sm-md-preview-display]': 'previewDisplay()',
    '[style.--sm-md-editor-display]': 'editorDisplay()',
  },
  imports: [
    TooltipDirective,
    LMarkdownEditorModule,
    FormsModule,
    MatMenuModule,
    BaseNamePipe,
    ClickStopPropagationDirective,
    MatButton,
    MatIcon,
    MatIconButton
  ]
})
export class MarkdownEditorComponent {
  private store = inject(Store);
  private reportService = inject(ReportCodeEmbedBaseService);
  protected dialog = inject(MatDialog);

  protected isDirty = signal(false);
  private _editMode = signal(false);
  private innerWidth = signal(window.innerWidth);
  protected editorVisible = signal(false);

  protected readonly options = {
    enablePreviewContentClick: true,
    fontAwesomeVersion: '6',
    showPreviewPanel: true,
    resizable: false,
    showBorder: true,
    hideIcons: ['TogglePreview', 'FullScreen']
  } as MdEditorOption;
  private ace: Ace.Editor;
  public isExpand = signal(false);
  theme = this.store.selectSignal(selectThemeMode);

  previewDisplay = computed(() => {
    if (this.innerWidth() > BREAK_POINT) {
      return 'block';
    }
    if (this._editMode()) {
      return this.editorVisible() ? 'block' : 'none';
    }
    return 'block';
  });

  editorDisplay = computed(() => {
    if (this.innerWidth() > BREAK_POINT) {
      return this._editMode() ? 'block' : 'none';
    }
    if (this._editMode()) {
      return this.editorVisible() ? 'none' : 'block';
    }
    return 'none';
  });

  public postRender = (dirty: string): string => {
    if (this.blockUserScripts()) {
      return '<div class="d-flex-center flex-column h-100 mt-4">' +
        '<div>Preview not available because 3rd party scripts are blocked.</div>' +
        '<div>You can enable it in under <a href="/settings/webapp-configuration">User Preferences</a>.</div>' +
        '</div>';
    }
    return DOMPurify.sanitize(dirty, {ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'], FORBID_ATTR: ['action']});
  };
  protected state = computed(() => ({
    data: this.data(),
    model: signal(this.data())
  }));

  protected duplicateNames = computed(() => {
    this.getData();
    const names = Array.from(this.getData().matchAll(/<iframe[^>]*?name=(["'])?((?:.(?!\1|>))*.?)\1?/g)).map(a => a[2]);
    const uniqueNames = new Set(names);
    let duplicatedNames = [];
    for (const name of uniqueNames) {
      const dups = names.map(e => e === name ? name : '').filter(String).slice(1);
      duplicatedNames = duplicatedNames.concat(dups);
    }
    return duplicatedNames.length > 0;
  });

  get getData() {
    return this.state().model;
  }

  get aceEditor() {
    return this.ace;
  }

  set editMode(editMode: boolean) {
    this._editMode.set(editMode);
    (window as unknown as {holdIframe: boolean}).holdIframe = editMode;
    this.editModeChanged.emit();
    window.setTimeout(() => this.ace?.resize(), 500);
  }

  get editMode() {
    return this._editMode();
  }

  data = input<string>();
  readOnly = input<boolean>();
  handleUpload = input<(files: FileList) => Promise<UploadResult[]>>();
  resources = input([] as {
    unused: boolean;
    url: string;
  }[]);
  blockUserScripts = input(false);
  saveInfo = output<string>();
  @Output() editModeChanged = new EventEmitter();
  dirtyChanged = output<boolean>();
  deleteResource = output<string>();
  imageMenuOpened = output<string>();
  editorComponent = viewChild(MDComponent);

  onResize() {
    this.innerWidth.set(window.innerWidth);
  }

  constructor() {
    window['marked'] = marked;
    this.editMode = false;

    const widgetOrigin = this.reportService.getUrl().toString();
    DOMPurify.addHook(
      'uponSanitizeElement',
      (currentNode, hookEvent) => {
        const iframe = currentNode as HTMLIFrameElement;
        if (hookEvent.tagName === 'iframe' && !iframe.src.startsWith(widgetOrigin)) {
          iframe.src = '';
        }
        return currentNode;
      }
    );

    effect(() => {
      if (this.editorComponent()) {
        const aceEditor = this.editorComponent()['_aceEditorIns'] as unknown as Ace.Editor;
        aceEditor.setShowPrintMargin(false);
        if (this.theme() === 'dark') {
          aceEditor.setTheme('ace/theme/github_dark');
        } else {
          aceEditor.setTheme('ace/theme/github_light_default');
        }
      }
    });
  }

  save() {
    this.saveInfo.emit(this.getData());
    this.editMode = false;
    this.isDirty.set(false);
  }

  editClicked() {
    this.editMode = true;
    this.editorVisible.set(false);
    setTimeout(() => {
      this.ace?.focus();
    });
  }

  cancelClicked() {
    if (this.getData() === this.data()) {
      // Force to rerender preview panel when dirty and same text
      this.getData.set('');
      setTimeout(() => this.getData.set(this.data()));
    } else {
      this.getData.set(this.data());
    }
    this.editMode = false;
    this.isDirty.set(false);
  }

  editorReady(ace: Ace.Editor) {
    this.ace = ace;
    this.ace.container.style.lineHeight = '1.8em';
    this.ace.setOptions({
      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12
    });
  }

  togglePreview() {
    this.editorVisible.update(v => !v);
  }

  checkDirty() {
    const isDirty = this.getData() !== this.data();
    if (isDirty !== this.isDirty()) {
      this.dirtyChanged.emit(isDirty);
    }
    this.isDirty.set(isDirty);
  }

  domFixes() {
    this.editorComponent().previewContainer.nativeElement.id = 'print-element';

    if (this.getData().indexOf('```language') > -1) {
      const manager = this.ace.session.getUndoManager();
      const range = this.ace.find('```language', {
        wrap: true,
        caseSensitive: true,
        wholeWord: true,
        regExp: false,
        preventScroll: true // do not change selection
      });
      const deltas = manager.getDeltas(null, null);
      if (range) {
        this.ace.session.replace(range, '```py');
      }
      manager['$undoStack'] = deltas;
    }
  }

  expandClicked() {
    this.isExpand.update(e => !e);
    this.editModeChanged.emit();
  }


  openMDCCheatSheet() {
    this.dialog.open(MarkdownCheatSheetDialogComponent, {
      panelClass: 'dialog-md'
    });
  }

  uploadImg(evt: Event) {
    if (!evt) {
      return;
    }
    this.handleUpload()((evt.target as HTMLInputElement).files).then(
      results => results.map(result => this.ace.insert(`![${result.name}](${result.url})\n`))
    );
  }

  insertImage(resource: string) {
    this.ace.insert(`![${decodeURIComponent(getBaseName(resource))}](${resource})\n`);
  }
}

