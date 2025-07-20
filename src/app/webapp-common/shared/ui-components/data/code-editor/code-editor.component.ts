import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone, input, output, viewChild, inject, effect, computed
} from '@angular/core';
import {Ace} from 'ace-builds';
import {Store} from '@ngrx/store';
import {selectAceReady, selectThemeMode} from '@common/core/reducers/view.reducer';
import {addMessage} from '@common/core/actions/layout.actions';
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
  private zone = inject(NgZone);
  private store = inject(Store);

  mode = input('python');
  readonly = input(false);
  placeholder = input<string>();
  showCopyButton = input(false);
  code = input<string>();
  startPosition = input<Ace.Point>();
  codeChanged = output<string>();
  private aceEditorElement = viewChild<ElementRef<HTMLDivElement>>('aceEditor');
  private aceMode = computed(() => 'ace/mode/' + this .mode());
  private theme = this.store.selectSignal(selectThemeMode);
  private aceReady = this.store.selectSignal(selectAceReady);

  constructor() {
    ace.config.loadModule('ace/ext/searchbox');

    fromEvent(document, 'keyup')
      .pipe(takeUntilDestroyed())
      .subscribe((event: KeyboardEvent) => {
        if (event.ctrlKey && event.code === 'KeyF') {
          event.stopPropagation();
          this.openSearch();
        }
      });

    effect(() => {
      if (this.aceReady() && this.aceEditorElement()) {
        this.initAceEditor();
      }
    });

    effect(() => {
      this.aceEditor?.getSession().setValue(this.code());
    });

    effect(() => {
      this.aceEditor?.getSession().setMode(this.aceMode());
    });

    effect(() => {
      this.updateTheme();
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
      });
      this.aceEditor.getSession().on('change', () => {
        this.codeChanged.emit(this.aceEditor.getSession().getValue());
      });

      aceEditor.renderer.setScrollMargin(12, 12, 12, 12);
      aceEditor.renderer.setPadding(24);
      aceEditor.session.setMode(this.aceMode());
      this.updateTheme()

      if (this.readonly()) {
        aceEditor.renderer.hideCursor();
      }

      aceEditor.getSession().setValue(this.code());
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
