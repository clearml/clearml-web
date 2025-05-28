import {ChangeDetectionStrategy, Component, Input, output, ViewChild, input } from '@angular/core';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import {Project} from '~/business-logic/model/projects/project';
import {trackById} from '@common/shared/utils/forms-track-by';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {BreadcrumbsEllipsisPipe} from '@common/shared/pipes/breadcrumbs-ellipsis.pipe';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ProjectsSharedModule} from '~/features/projects/shared/projects-shared.module';
import {CircleCounterComponent} from '@common/shared/ui-components/indicators/circle-counter/circle-counter.component';

import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {ProjectCardMenuExtendedComponent} from '~/features/projects/containers/project-card-menu-extended/project-card-menu-extended.component';


@Component({
    selector: 'sm-project-card',
    templateUrl: './project-card.component.html',
    styleUrls: ['./project-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkVirtualScrollViewport,
    CardComponent,
    TooltipDirective,
    BreadcrumbsEllipsisPipe,
    ShowTooltipIfEllipsisDirective,
    ProjectsSharedModule,
    CircleCounterComponent,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    ClickStopPropagationDirective,
    ProjectCardMenuExtendedComponent,
  ]
})
export class ProjectCardComponent {
  private _project: ProjectsGetAllResponseSingle;
  public computeTime: string;
  public hidden = false;
  trackById = trackById;
  readonly circleTypeEnum = CircleTypeEnum;

  projectsNames = input<string[]>();

  @Input() set project(data: Project) {
    this._project = data;
    this.hidden = data.hidden || data.system_tags?.includes('hidden');
    this.computeTime = this.convertSecToDaysHrsMinsSec(data.stats?.active?.total_runtime);
  };

  get project() {
    return this._project;
  }

  isRootProject = input();
  hideProjectPathIcon = input(false);
  hideMenu = input(false);
  projectCardClicked = output<Project>();
  projectNameChanged = output<string>();
  deleteProjectClicked = output<Project>();
  moveToClicked = output<Project>();
  newProjectClicked = output<Project>();
  projectEditClicked = output<Project>();
  projectSettingsClicked = output<Project>();
  @ViewChild('projectName', {static: true}) projectName;


  public convertSecToDaysHrsMinsSec(secs) {
    const dayInSec = 60 * 60 * 24;
    const hourInSec = 60 * 60;
    const minInSec = 60;
    const d = Math.floor(secs / dayInSec);
    const h = Math.floor((secs - (d * dayInSec)) / hourInSec);
    const m = Math.floor((secs - (d * dayInSec + h * hourInSec)) / minInSec);
    const s = secs % 60;
    const H = h < 10 ? '0' + h : h;
    const M = m < 10 ? '0' + m : m;
    const S = s < 10 ? '0' + s : s;
    return `${d === 1 ? d + ' DAY ' : d > 1 ? d + ' DAYS ' : ''} ${H}:${M}:${S}`;
  }

  public projectClicked() {
      this.projectCardClicked.emit(this.project);
  }



  subProjectClicked(id: string) {
    this.projectCardClicked.emit({id});
  }

  prepareProjectNameForChange(projectName: string) {
    this.projectNameChanged.emit(this.project.name.substring(0, this.project.name.lastIndexOf('/') + 1) + projectName);
  }
}
