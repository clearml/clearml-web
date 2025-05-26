import {ChangeDetectionStrategy, Component, inject, input, model} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ConfigurationService} from '@common/shared/services/configuration.service';

@Component({
    selector: 'sm-pipelines-empty-state',
    templateUrl: './pipelines-empty-state.component.html',
    styleUrls: ['./pipelines-empty-state.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
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
