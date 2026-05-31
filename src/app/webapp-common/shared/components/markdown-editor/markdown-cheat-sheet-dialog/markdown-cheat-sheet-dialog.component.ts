import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {httpResource} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

@Component({
  selector: 'sm-markdown-cheat-sheet-dialog',
  templateUrl: './markdown-cheat-sheet-dialog.component.html',
  styleUrls: ['./markdown-cheat-sheet-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent
  ]
})
export class MarkdownCheatSheetDialogComponent {
  private sanitizer = inject(DomSanitizer);
  public mdCheatSheetHtmlFile = httpResource.text(() =>
      'app/webapp-common/assets/markdown-cheatsheet.html',
    {parse: this.sanitizer.bypassSecurityTrustHtml}
  );
}
