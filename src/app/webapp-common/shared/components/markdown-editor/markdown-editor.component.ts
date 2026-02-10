import {
  Component,
  HostListener, inject,
  Renderer2,
  input, output, Output, EventEmitter, computed, signal, effect, viewChild
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
  private renderer = inject(Renderer2);
  protected dialog = inject(MatDialog);

  private ready = false;
  private preview: Element;
  private editor: Element;
  public isDirty: boolean;
  public editorVisible: boolean;
  private _editMode: boolean;
  public options = {
    enablePreviewContentClick: true,
    fontAwesomeVersion: '6',
    showPreviewPanel: true,
    resizable: false,
    showBorder: true,
    hideIcons: ['TogglePreview', 'FullScreen']
  } as MdEditorOption;
  public ace: Ace.Editor;
  public isExpand = false;
  public duplicateNames: boolean;
  theme = this.store.selectSignal(selectThemeMode);
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

  get getData() {
    return this.state().model;
  }

  set editMode(editMode: boolean) {
    this._editMode = editMode;
    (window as any).holdIframe = editMode;
    this.editModeChanged.emit();
    window.setTimeout(() => this.ace?.resize(), 500);
  }

  get editMode() {
    return this._editMode;
  }

  data = input<string>();
  readOnly = input<boolean>();
  handleUpload = input<(files: File[]) => Promise<UploadResult[]>>();
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

  @HostListener('window:resize', ['$event'])
  updateEditorVisibility() {
    if (!this.ready) {
      return;
    }

    if (window.innerWidth > BREAK_POINT) {
      if (this.editMode) {
        this.renderer.setStyle(this.preview, 'display', 'block');
        this.renderer.setStyle(this.editor, 'display', 'block');
      } else {
        this.renderer.setStyle(this.preview, 'display', 'block');
        this.renderer.setStyle(this.editor, 'display', 'none');
      }
    } else if (this.editMode) {
      this.renderer.setStyle(this.preview, 'display', 'none');
      this.renderer.setStyle(this.editor, 'display', 'block');
    } else {
      this.renderer.setStyle(this.preview, 'display', 'block');
      this.renderer.setStyle(this.editor, 'display', 'none');
    }
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
    this.isDirty = false;
    this.updateEditorVisibility();
  }

  editClicked() {
    this.editMode = true;
    this.editorVisible = false;
    setTimeout(() => {
      this.updateEditorVisibility();
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
    this.isDirty = false;
    this.updateEditorVisibility();
  }

  editorReady(ace: Ace.Editor) {
    this.ace = ace;
    this.ace.container.style.lineHeight = '1.8em';
    this.ace.setOptions({
      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12
    });
    this.ready = true;
    this.preview = document.querySelector('.preview-container');
    this.editor = document.querySelector('.editor-container > div:first-child');
  }

  togglePreview() {
    this.renderer.setStyle(this.preview, 'display', this.editorVisible ? 'none' : 'block');
    this.renderer.setStyle(this.editor, 'display', !this.editorVisible ? 'none' : 'block');
    this.editorVisible = !this.editorVisible;
  }

  checkDirty() {
    const isDirty = this.getData() !== this.data();
    if (isDirty !== this.isDirty) {
      this.dirtyChanged.emit(isDirty);
    }
    this.isDirty = isDirty;
    this.getDuplicateIframes();
  }

  domFixes() {
    this.renderer.setProperty(this.editorComponent().previewContainer.nativeElement, 'id', 'print-element');

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
    this.isExpand = !this.isExpand;
    this.editModeChanged.emit();
  }

  private getDuplicateIframes() {
    const names = Array.from(this.getData().matchAll(/<iframe[^>]*?name=(["\'])?((?:.(?!\1|>))*.?)\1?/g)).map(a => a[2]);
    const uniqueNames = new Set(names);
    let duplicatedNames = [];
    for (const name of uniqueNames) {
      const dups = names.map(e => e === name ? name : '').filter(String).slice(1);
      duplicatedNames = duplicatedNames.concat(dups);
    }
    this.duplicateNames = duplicatedNames.length > 0;
  }

  openMDCCheatSheet() {
    this.dialog.open(MarkdownCheatSheetDialogComponent);
  }

  uploadImg(evt) {
    if (!evt) {
      return;
    }
    this.handleUpload()(evt.target.files).then(
      results => results.map(result => this.ace.insert(`![${result.name}](${result.url})\n`))
    );
  }

  insertImage(resource: string) {
    this.ace.insert(`![${decodeURIComponent(getBaseName(resource))}](${resource})\n`);
  }
}

