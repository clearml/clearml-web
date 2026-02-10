import {ChangeDetectionStrategy, Component, inject, input, model} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'sm-pipelines-empty-state',
  templateUrl: './pipelines-empty-state.component.html',
  styleUrls: ['./pipelines-empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeEditorComponent,
    CodeEditorComponent,
    DialogTemplateComponent,
    NgTemplateOutlet
  ]
})
export class PipelinesEmptyStateComponent{
  protected readonly confService = inject(ConfigurationService);
  public data = inject<{pipelineCode?: string}>(MAT_DIALOG_DATA, { optional: true });

  initPipelineCode = model<string>();
  createButton = input<boolean>(false);

  constructor() {
    if (this.data?.pipelineCode) {
      window.setTimeout(()=> {
        this.initPipelineCode.set(this.data?.pipelineCode);
      }, 300);
    }
  }
}
