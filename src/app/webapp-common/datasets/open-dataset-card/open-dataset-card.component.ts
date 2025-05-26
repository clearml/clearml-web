import {ChangeDetectionStrategy, Component} from '@angular/core';
import {PipelineCardComponent} from '@common/pipelines/pipeline-card/pipeline-card.component';
import {fileSizeConfigStorage} from '@common/shared/pipes/filesize.pipe';

@Component({
    selector: 'sm-open-dataset-card',
    templateUrl: './open-dataset-card.component.html',
    styleUrls: ['./open-dataset-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false
})
export class OpenDatasetCardComponent extends PipelineCardComponent{
  protected readonly fileSizeConfigStorage = {...fileSizeConfigStorage, spacer: '', round: 1};
}
