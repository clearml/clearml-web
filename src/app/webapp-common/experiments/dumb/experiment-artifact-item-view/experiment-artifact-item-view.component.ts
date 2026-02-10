import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Artifact} from '~/business-logic/model/tasks/artifact';
import {BaseClickableArtifactComponent} from '../base-clickable-artifact.component';
import {fileSizeConfigStorage, FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {ScrollTextareaComponent} from '@common/shared/components/scroll-textarea/scroll-textarea.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {UpperCasePipe} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-experiment-artifact-item-view',
  templateUrl: './experiment-artifact-item-view.component.html',
  styleUrls: ['./experiment-artifact-item-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SectionHeaderComponent,
    ScrollTextareaComponent,
    CopyClipboardComponent,
    EditableSectionComponent,
    LabeledRowComponent,
    MatProgressSpinner,
    FileSizePipe,
    UpperCasePipe,
    MatIconModule,
    MatIconButton
  ]
})
export class ExperimentArtifactItemViewComponent extends BaseClickableArtifactComponent{
  public isLocalFile: boolean;
  public isLinkable: boolean;
  public fileSizeConfigStorage = fileSizeConfigStorage;
  public inMemorySize: boolean;
  private _artifact: Artifact;

  @Input() editable: boolean;
  @Input() downloading: boolean;

  @Input() set artifact(artifact: Artifact) {
    this._artifact = artifact;
    if(artifact){
      this.timestamp = artifact.timestamp;
      this.inMemorySize = Number.isInteger(artifact?.content_size) && artifact.content_size < 500 * 1e6;
      this.isLocalFile = artifact.uri && this.adminService.isLocalFile(artifact.uri);
      try {
        if (artifact?.uri && !this.isLocalFile && new URL(this.artifact.uri)) {
          this.isLinkable = true;
        }
      } catch {
        this.isLinkable = false;
      }
    }
  }

  get artifact(): Artifact {
    return this._artifact;
  }

  linkClicked(event: Event) {
    this.signUrl(this.artifact.uri).subscribe(signed => {
      const a = document.createElement('a');
      a.href = signed;
      a.target = '_blank';
      a.click();
    });
    event.preventDefault();
  }
}
