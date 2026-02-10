import {Component, effect, viewChild} from '@angular/core';
import {ControllersComponent} from '@common/pipelines-controller/controllers.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {Observable} from 'rxjs';
import {CountAvailableAndIsDisableSelectedFiltered} from '@common/shared/entity-page/items.utils';
import * as experimentsActions from '@common/experiments/actions/common-experiments-view.actions';
import {INITIAL_CONTROLLER_TABLE_COLS} from '@common/pipelines-controller/controllers.consts';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {take} from 'rxjs/operators';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {setExperiment} from '@common/experiments/actions/common-experiments-info.actions';
import {
  OpenDatasetVersionMenuComponent
} from '@common/dataset-version/open-dataset-version-menu/open-dataset-version-menu.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ExperimentsTableComponent} from '@common/experiments/dumb/experiments-table/experiments-table.component';
import {
  OpenDatasetVersionInfoComponent
} from '@common/dataset-version/open-dataset-version-info/open-dataset-version-info.component';
import {EntityFooterComponent} from '@common/shared/entity-page/entity-footer/entity-footer.component';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {ExperimentHeaderComponent} from '@common/experiments/dumb/experiment-header/experiment-header.component';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {PushPipe} from '@ngrx/component';

@Component({
  selector: 'sm-open-dataset-versions',
  templateUrl: './open-dataset-versions.component.html',
  styleUrls: ['./open-dataset-versions.component.scss', '../../pipelines-controller/controllers.component.scss'],
  imports: [
    ExperimentsTableComponent,
    OpenDatasetVersionMenuComponent,
    OpenDatasetVersionInfoComponent,
    EntityFooterComponent,
    OverlayComponent,
    ExperimentHeaderComponent,
    SplitComponent,
    SplitAreaComponent,
    PushPipe
  ]
})
export class OpenDatasetVersionsComponent extends ControllersComponent {
  override contextMenu = viewChild.required(OpenDatasetVersionMenuComponent);

  protected override get entityType() {
    return EntityTypeEnum.dataset;
  }

  protected override getParamId(params) {
    return params?.versionId;
  }

  protected override get tableCols() {
    return INITIAL_CONTROLLER_TABLE_COLS.map((col) =>
      col.id === EXPERIMENTS_TABLE_COL_FIELDS.NAME ?
        {...col, header: 'VERSION NAME'} :
        col.id === EXPERIMENTS_TABLE_COL_FIELDS.SELECTED ? {...col, disablePointerEvents: false} : col);
  }

  constructor() {
    super();
    effect(() => {
      // No experiment's OnDestroy (that reset selected) running because info component always on.
      if (!this.minimizedView()) {
        this.store.dispatch(setExperiment({experiment: null}));
      }
    });

    this.experiments$
      .pipe(
        takeUntilDestroyed(),
        take(1))
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
    this.table().table().downloadTableAsCSV(`ClearML ${this.selectedProject().id === '*'? 'All': this.selectedProject()?.basename?.substring(0,60)} Datasets`);
  }
  override setupBreadcrumbsOptions() {
    effect(() => {
      const selectedProject = this.selectedProject();
      if (selectedProject) {
        this.store.dispatch(setBreadcrumbsOptions({
          breadcrumbOptions: {
            showProjects: !!selectedProject,
            featureBreadcrumb: {
              name: 'DATASETS',
              url: this.defaultNestedModeForFeature()['datasets'] ? 'datasets/simple/*/projects' : 'datasets'
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
      }
    });
  }
}
