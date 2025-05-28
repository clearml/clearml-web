import {ChangeDetectionStrategy, Component, inject, input, computed} from '@angular/core';
import {ActiveSectionEnum} from '@common/experiments/experiment.consts';
import {Artifact} from '~/business-logic/model/tasks/artifact';
import {IModelInfo} from '../../shared/common-experiment-model.model';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {safeAngularUrlParameterPipe} from '@common/shared/pipes/safeAngularUrlParameter.pipe';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-experiment-artifacts-navbar',
    templateUrl: './experiment-artifacts-navbar.component.html',
    styleUrls: ['./experiment-artifacts-navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatExpansionPanel,
        MatExpansionPanelHeader,
        RouterLink,
        safeAngularUrlParameterPipe,
        MatIcon
    ]
})
export class ExperimentArtifactsNavbarComponent {
  public route = inject(ActivatedRoute);

  readonly DATA_AUDIT_TABLE = 'data-audit-table';
  public ACTIVE_SECTIONS    = ActiveSectionEnum;

  artifacts = input<Artifact[]>();
  selectedArtifactKey = input();
  outputModels = input<IModelInfo[]>();
  inputModels = input<IModelInfo[]>();
  editable = input();
  activeSection = input<ActiveSectionEnum>();
  routerConfig = input<string[]>();

  noItemsMode = computed( () => this.outputModels()?.length === 0 && this.inputModels()?.length === 0);
  dataAuditArtifacts = computed( () => this.artifacts()?.filter(artifact => artifact.type === this.DATA_AUDIT_TABLE));
  otherArtifacts = computed( () => this.artifacts()?.filter(artifact => artifact.type !== this.DATA_AUDIT_TABLE));
}
