import {ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {IExperimentDetail} from '~/features/experiments-compare/experiments-compare-models';
import {TIME_FORMAT_STRING} from '@common/constants';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import {NAPipe} from '@common/shared/pipes/na.pipe';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {EllipsisMiddleDirective} from '@common/shared/ui-components/directives/ellipsis-middle.directive';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';

@Component({
    selector: 'sm-experiment-compare-general-data',
    templateUrl: './experiment-compare-general-data.component.html',
    styleUrls: ['./experiment-compare-general-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TooltipDirective,
        RouterLink,
        IdBadgeComponent,
        TagListComponent,
        DecimalPipe,
        NAPipe,
        TimeAgoPipe,
        DatePipe,
        EllipsisMiddleDirective,
        StatusIconLabelComponent
    ]
})
export class ExperimentCompareGeneralDataComponent {

  private route = inject(ActivatedRoute);

  @Input() experiment: IExperimentDetail;
  @Input() isOrigin = false;
  @Input() tags: string[];
  @Output() copyIdClicked = new EventEmitter();
  timeFormatString = TIME_FORMAT_STRING;

  copyToClipboard() {
    this.copyIdClicked.emit();
  }

  buildUrl() {
    const projectOrPipeline = this.route.root.firstChild.firstChild.routeConfig.path.replace('datasets', 'datasets/simple/');
    const targetEntity = this.route.snapshot.parent.data.entityType === EntityTypeEnum.model ? EntityTypeEnum.model : EntityTypeEnum.experiment;
    return [`/${projectOrPipeline}`, this.experiment.project?.id || '*', `${targetEntity}s`, this.experiment.id];
  }
}
