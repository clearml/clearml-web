import {Component} from '@angular/core';
import {NestedProjectViewPageComponent, ProjectTypeEnum} from '@common/nested-project-view/nested-project-view-page/nested-project-view-page.component';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import { AsyncPipe } from '@angular/common';
import {ProjectsPageComponent} from '@common/projects/containers/projects-page/projects-page.component';
import {DatasetEmptyComponent} from '@common/datasets/dataset-empty/dataset-empty.component';
import {CircleCounterComponent} from '@common/shared/ui-components/indicators/circle-counter/circle-counter.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
    selector: 'sm-nested-datasets-page',
    templateUrl: './nested-datasets-page.component.html',
    styleUrls: [
        '../../../webapp-common/nested-project-view/nested-project-view-page/nested-project-view-page.component.scss',
        '../../../webapp-common/datasets/open-datasets/open-datasets.component.scss'
    ],
  imports: [
    AsyncPipe,
    CircleCounterComponent,
    TagListComponent,
    MatButton,
    MatIcon,
    ClickStopPropagationDirective,
    NestedProjectViewPageComponent,
    DatasetEmptyComponent
  ]
})
export class NestedDatasetsPageComponent extends ProjectsPageComponent {
  entityTypeEnum = ProjectTypeEnum;
  circleTypeEnum = CircleTypeEnum;
  hideMenu = false;
  entityType = ProjectTypeEnum.datasets;

  override projectCardClicked(data: { hasSubProjects: boolean; id: string; name: string }) {
    if (data.hasSubProjects) {
      this.router.navigate(['simple', data.id, 'projects'], {relativeTo: this.route.parent?.parent});
    } else {
      this.router.navigate(['simple', data.id, ProjectTypeEnum.datasets], {relativeTo: this.route.parent?.parent});
    }
  }

  createExamples() {
    this.dialog.open(DatasetEmptyComponent, {
      maxWidth: '95vw',
      width: '1248px'
    });
  }

  toggleNestedView(nested: boolean) {
    if (!nested) {
      this.router.navigateByUrl(this.entityType);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override getExtraProjects(selectedProjectId, selectedProject) {
    return [];
  }

}
