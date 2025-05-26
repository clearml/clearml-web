import {Component, OnInit} from '@angular/core';
import {PipelinesPageComponent} from '@common/pipelines/pipelines-page/pipelines-page.component';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {
  setBreadcrumbsOptions,
  setDefaultNestedModeForFeature,
  setSelectedProjectId
} from '@common/core/actions/projects.actions';
import {showExampleDatasets} from '../../projects/common-projects.actions';
import {selectShowDatasetExamples} from '../../projects/common-projects.reducer';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {DatasetEmptyComponent} from '@common/datasets/dataset-empty/dataset-empty.component';
import {withLatestFrom} from 'rxjs/operators';
import {selectDefaultNestedModeForFeature} from '@common/core/reducers/projects.reducer';

@Component({
    selector: 'sm-open-datasets',
    templateUrl: './open-datasets.component.html',
    styleUrls: ['./open-datasets.component.scss'],
    standalone: false
})
export class OpenDatasetsComponent extends PipelinesPageComponent implements OnInit {

  public override projectCardClicked(project: ProjectsGetAllResponseSingle) {
    this.router.navigate(['simple', project.id, 'tasks'], {relativeTo: this.projectId? this.route.parent.parent: this.route});
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: this.isExample(project)}));
  }

  protected override getName() {
    return EntityTypeEnum.openDataset;
  }

  protected override getDeletePopupEntitiesList() {
    return 'version';
  }

  override noProjectsReRoute() {
    return this.router.navigate(['..', 'datasets'], {relativeTo: this.route});
  }

  createDataset() {
    this.dialog.open(DatasetEmptyComponent, {
      maxWidth: '95vw',
      width: '1248px'
    });
  }

  public override createExamples() {
    this.store.dispatch(showExampleDatasets());
  }
  override ngOnInit() {
    super.ngOnInit();
    this.showExamples$ = this.store.select(selectShowDatasetExamples);
  }
  override toggleNestedView(nested: boolean) {
    this.store.dispatch(setDefaultNestedModeForFeature({feature: 'datasets', isNested: nested}));

    if (nested) {
      this.router.navigate(['simple', '*', 'projects'], {relativeTo: this.route});
    } else {
      this.router.navigateByUrl('datasets');
    }
  }

  override setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe(
      withLatestFrom(this.store.select(selectDefaultNestedModeForFeature))
    ).subscribe(([selectedProject, defaultNestedModeForFeature]) => {
      this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!selectedProject,
          featureBreadcrumb: {
            name: 'DATASETS',
            url: defaultNestedModeForFeature['datasets'] ? 'datasets/simple/*/projects' : 'datasets'
          },
          projectsOptions: {
            basePath: 'datasets/simple',
            filterBaseNameWith: ['.datasets'],
            compareModule: null,
            showSelectedProject: selectedProject?.id !== '*',
            ...(selectedProject && selectedProject?.id !== '*' && {selectedProjectBreadcrumb: {name: selectedProject?.basename}})
          }
        }
      }));
    }));
  }
}
