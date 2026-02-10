import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {Store} from '@ngrx/store';
import {combineLatest} from 'rxjs';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {selectDownloadingArtifact, selectExperimentModelInfoData} from '../../reducers';
import {
  ExperimentArtifactItemViewComponent
} from '@common/experiments/dumb/experiment-artifact-item-view/experiment-artifact-item-view.component';
import {PushPipe} from '@ngrx/component';


@Component({
  selector: 'sm-experiment-info-artifact-item',
  templateUrl: './experiment-info-artifact-item.component.html',
  styleUrls: ['./experiment-info-artifact-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExperimentArtifactItemViewComponent,
    PushPipe,
  ]
})
export class ExperimentInfoArtifactItemComponent {
  private store = inject(Store);

  protected modelInfo$ = this.store.select(selectExperimentModelInfoData);
  protected artifactKey$ = this.store.select(selectRouterParams)
    .pipe(
      map(params => ({key: decodeURIComponent(params?.artifactId), mode: params?.mode})),
      filter(artifactId => !!artifactId),
      distinctUntilChanged()
    );
  protected downloadingArtifact$ = this.store.select(selectDownloadingArtifact);
  protected selectedArtifact$ = combineLatest([this.artifactKey$, this.modelInfo$])
    .pipe(
      filter(([artifactKey, modelInfo]) => !!(artifactKey && artifactKey.key) && !!modelInfo),
      map(([artifactKey, modelInfo]) =>
        modelInfo.artifacts.find(artifact => (artifact.key === artifactKey.key && artifact.mode === artifactKey.mode))
      )
    );
}
