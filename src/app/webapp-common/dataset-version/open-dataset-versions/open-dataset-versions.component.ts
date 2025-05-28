import {Component, OnInit, viewChild} from '@angular/core';
import {ControllersComponent} from '@common/pipelines-controller/controllers.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {Observable} from 'rxjs';
import {CountAvailableAndIsDisableSelectedFiltered} from '@common/shared/entity-page/items.utils';
import * as experimentsActions from '@common/experiments/actions/common-experiments-view.actions';
import {INITIAL_CONTROLLER_TABLE_COLS} from '@common/pipelines-controller/controllers.consts';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {take, withLatestFrom} from 'rxjs/operators';
import {selectDefaultNestedModeForFeature} from '@common/core/reducers/projects.reducer';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {setExperiment} from '@common/experiments/actions/common-experiments-info.actions';
import {
  OpenDatasetVersionMenuComponent
} from '@common/dataset-version/open-dataset-version-menu/open-dataset-version-menu.component';

@Component({
    selector: 'sm-open-dataset-versions',
    templateUrl: './open-dataset-versions.component.html',
    styleUrls: ['./open-dataset-versions.component.scss', '../../pipelines-controller/controllers.component.scss'],
    standalone: false
})
export class OpenDatasetVersionsComponent extends ControllersComponent implements OnInit {
  override contextMenu = viewChild.required(OpenDatasetVersionMenuComponent);
  isArchived: boolean;

  protected override getParamId(params) {
    return params?.versionId;
  }

  constructor() {
    super();
    this.entityType = EntityTypeEnum.dataset;
    this.tableCols = INITIAL_CONTROLLER_TABLE_COLS.map((col) =>
      col.id === EXPERIMENTS_TABLE_COL_FIELDS.NAME ? {...col, header: 'VERSION NAME'} :
        col.id === EXPERIMENTS_TABLE_COL_FIELDS.SELECTED ? {...col, disablePointerEvents: false} : col);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.experiments$
      .pipe(take(1))
      .subscribe(experiments => {
        this.firstExperiment = experiments?.[0];
        if (this.firstExperiment) {
          if (!this.route.snapshot.firstChild?.params.versionId) {
            this.store.dispatch(experimentsActions.experimentSelectionChanged({
              experiment: this.firstExperiment,
              project: this.selectedProjectId,
              replaceURL: true
            }));
          }
        }
      });

    // No experiment's OnDestroy (that reset selected) running because info component always on.
    this.sub.add(this.minimizedView$.subscribe(minimized => {
      if (!minimized) {
        this.store.dispatch(setExperiment({experiment: null}));
      }
    }))
  }

  override createFooterItems(config: {
    entitiesType: EntityTypeEnum;
    selected$: Observable<any[]>;
    showAllSelectedIsActive$: Observable<boolean>;
    tags$: Observable<string[]>;
    data$?: Observable<Record<string, CountAvailableAndIsDisableSelectedFiltered>>;
    companyTags$: Observable<string[]>;
    projectTags$: Observable<string[]>;
    tagsFilterByProject$: Observable<boolean>;
  }) {
    super.createFooterItems(config);
    this.footerItems.splice(5, 1);
  }

  override downloadTableAsCSV() {
    this.table().table.downloadTableAsCSV(`ClearML ${this.selectedProject.id === '*'? 'All': this.selectedProject?.basename?.substring(0,60)} Datasets`);
  }
  override setupBreadcrumbsOptions() {
    this.sub.add(this.selectedProject$.pipe(
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
