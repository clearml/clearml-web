import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

@Component({
    selector: 'sm-markdown-cheat-sheet-dialog',
    templateUrl: './markdown-cheat-sheet-dialog.component.html',
    styleUrls: ['./markdown-cheat-sheet-dialog.component.scss'],
    imports: [
        DialogTemplateComponent
    ]
})
export class MarkdownCheatSheetDialogComponent implements OnInit {
  public mdCheatSheetHtmlFile: SafeHtml;

  constructor(private http: HttpClient,
              private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.http.get('app/webapp-common/assets/markdown-cheatsheet.html', {responseType: 'text'}).subscribe(res => {
      this.mdCheatSheetHtmlFile = this.sanitizer.bypassSecurityTrustHtml(res);
    });
  }

}
