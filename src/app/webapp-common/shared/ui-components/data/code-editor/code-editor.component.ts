import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  viewChild
} from '@angular/core';
import {Ace} from 'ace-builds';
import {Store} from '@ngrx/store';
import {selectAceExtToolsReady, selectAceReady, selectThemeMode} from '@common/core/reducers/view.reducer';
import {aceExtToolsReady, addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';

import {ClipboardModule} from 'ngx-clipboard';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {fromEvent} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

declare const ace;

@Component({
    selector: 'sm-code-editor',
    templateUrl: './code-editor.component.html',
    styleUrls: ['./code-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ClipboardModule,
    MatButton,
    MatIcon,
    TooltipDirective
  ]
})
export class CodeEditorComponent {
  private el = inject(ElementRef);
  private zone = inject(NgZone);
  private store = inject(Store);

  mode = input('python');
  readonly = input(false);
  placeholder = input<string>();
  showCopyButton = input(false);
  showSearchButton = input(true);
  code = input<string>();
  autocompleteWordList = input<string[]>();
  startPosition = input<Ace.Point>();
  onExec = input<(e: {
    editor: Ace.Editor
    command: Ace.Command
    args: unknown[]
  }, editor: Ace.Editor) => void>();
  codeChanged = output<string>();
  private aceEditorElement = viewChild<ElementRef<HTMLDivElement>>('aceEditor');
  private aceMode = computed(() => 'ace/mode/' + this .mode());
  private theme = this.store.selectSignal(selectThemeMode);
  private aceReady = this.store.selectSignal(selectAceReady);
  private aceExtToolsReady = this.store.selectSignal(selectAceExtToolsReady);
  private isSettingValue = false;

  constructor() {
    effect(() => {
      if (this.aceReady()) {
        ace.config.loadModule('ace/ext/searchbox');
        ace.config.loadModule('ace/ext/language_tools', () => {
          this.zone.run(() => {
            this.store.dispatch(aceExtToolsReady());
          });
        });
      }
    });

    fromEvent(document, 'keyup')
      .pipe(takeUntilDestroyed())
      .subscribe((event: KeyboardEvent) => {
        if (event.ctrlKey && event.code === 'KeyF') {
          event.stopPropagation();
          this.openSearch();
        }
      });

    effect(() => {
      if (this.aceReady() && this.aceExtToolsReady() && this.aceEditorElement()) {
        this.initAceEditor();
      }
    });

    effect(() => {
      const currentCode = this.code() || '';
      if (this.aceEditor && currentCode !== this.aceEditor.getValue()) {
        this.isSettingValue = true;
        this.aceEditor.getSession().setValue(currentCode);
        this.isSettingValue = false;
      }
    });

    effect(() => {
      this.aceEditor?.getSession().setMode(this.aceMode());
    });

    effect(() => {
      this.updateTheme();
    });

    effect(() => {
      if (this.aceReady() && this.aceExtToolsReady() && this.aceEditor && this.autocompleteWordList()) {
        // Ensure language tools are loaded
        // ace.require('ace/ext/language_tools');

        // Remove previous custom completer if exists (avoid relying on removeCompleter API)
        if (this.completer && Array.isArray(this.aceEditor.completers)) {
          this.aceEditor.completers = this.aceEditor.completers.filter(c => c !== this.completer);
        }

        // Create a fresh static word-list completer
        this.completer = {
          getCompletions: (editor, session, pos, prefix, callback) => {
            const words = this.autocompleteWordList() || [];
            callback(null, words.map(word => ({
              caption: word,
              value: word,
              meta: 'static'
            })));
          }
        };

        // Append our completer to the editor's completers list
        this.aceEditor.completers = [this.completer];
      }
    });
  }

  get aceCode() {
    return this.aceEditor.getSession().getValue();
  }

  get position () {
    return this.aceEditor.selection.getCursor()
  }

  getEditor() {
    return this.aceEditor;
  }

  private aceEditor: Ace.Editor;
  private completer: Ace.Completer;

  private initAceEditor() {
    if (!this.aceEditorElement()) {
      this.aceEditor = null;
      return;
    }

    this.zone.runOutsideAngular(() => {
      const aceEditor = ace.edit(this.aceEditorElement().nativeElement) as Ace.Editor;
      this.aceEditor = aceEditor;
      aceEditor.setOptions({
        readOnly: this.readonly(),
        highlightGutterLine: !this.readonly(),
        placeholder: this.placeholder(),
        showLineNumbers: false,
        showGutter: false,
        fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
        fontSize: 13,
        highlightActiveLine: true,
        highlightSelectedWord: false,
        showPrintMargin: false,
        useWorker: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true
      });
      aceEditor.commands.on('exec', (e) => {
        this.onExec()?.(e, aceEditor);
      });

      this.aceEditor.getSession().on('change', () => {
        if (this.isSettingValue) {
          return;
        }
        const autocompleteEl = document.querySelector('.ace_autocomplete') as HTMLElement;
        if (autocompleteEl && autocompleteEl.parentElement !== this.el.nativeElement) {
          this.el.nativeElement.appendChild(autocompleteEl);
        }

        this.zone.run(() => {
          this.codeChanged.emit(this.aceEditor.getSession().getValue());
        });
      });

      aceEditor.renderer.setScrollMargin(12, 12, 12, 12);
      aceEditor.renderer.setPadding(24);
      aceEditor.session.setMode(this.aceMode());
      this.updateTheme()

      if (this.readonly()) {
        aceEditor.renderer.hideCursor();
      }

      this.isSettingValue = true;
      aceEditor.getSession().setValue(this.code() || '');
      this.isSettingValue = false;

      if (this.startPosition()) {
        setTimeout(() => {
          this.aceEditor.moveCursorTo(this.startPosition()?.row || 0, this.startPosition()?.column || 0);
          this.aceEditor.scrollToLine(this.startPosition()?.row || 0, true, false, () => {});
        });
      }

      aceEditor.focus();
      this.aceEditor = aceEditor;
    });
  }
  updateTheme() {
    if(this.theme() === 'dark') {
      this.aceEditor?.setTheme('ace/theme/github_dark');
    } else {
      this.aceEditor?.setTheme('ace/theme/github_light_default');
    }
  }

  copySuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Code copied to clipboard'));
  }

  openSearch() {
    this.aceEditor.execCommand('find');
  }
}
