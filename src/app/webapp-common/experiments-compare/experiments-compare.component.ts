import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {combineLatest, Subscription} from 'rxjs';
import {ActivatedRoute, Router, RouterLink, RouterOutlet} from '@angular/router';
import {selectGlobalLegendData, selectShowGlobalLegend} from './reducers';
import {combineLatestWith, distinctUntilChanged, filter, map, withLatestFrom} from 'rxjs/operators';
import {resetSelectCompareHeader, setShowGlobalLegend} from './actions/compare-header.actions';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {getCompanyTags, setBreadcrumbsOptions, setSelectedProject} from '@common/core/actions/projects.actions';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {TitleCasePipe} from '@angular/common';
import {resetSelectModelState} from '@common/select-model/select-model.actions';
import {ALL_PROJECTS_OBJECT} from '@common/core/effects/projects.effects';
import {trackById} from '@common/shared/utils/forms-track-by';
import {selectRouterConfig, selectRouterParams} from '@common/core/reducers/router-reducer';
import {rgbList2Hex} from '@common/shared/services/color-hash/color-hash.utils';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {EXPERIMENTS_COMPARE_ROUTES, MODELS_COMPARE_ROUTES} from '@common/experiments-compare/experiments-compare.constants';
import {headerActions} from '@common/core/actions/router.actions';
import {isEqual} from 'lodash-es';
import {selectProjectType} from '@common/core/reducers/view.reducer';
import {ExperimentCompareHeaderComponent} from '@common/experiments-compare/dumbs/experiment-compare-header/experiment-compare-header.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {PushPipe} from '@ngrx/component';
import {ChooseColorDirective} from '@common/shared/ui-components/directives/choose-color/choose-color.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ICONS} from '@common/constants';
import {experimentDetailsUpdated} from '@common/experiments/actions/common-experiments-info.actions';
import {getGlobalLegendData, setGlobalLegendData, setHighlightedTaskId} from './actions/experiments-compare-charts.actions';
import {MatDialog} from '@angular/material/dialog';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {FormsModule} from '@angular/forms';
import {MatDivider} from '@angular/material/list';
import {RenameDialogComponent} from '@common/shared/ui-components/overlay/rename-dialog/rename-dialog.component';
import {updateModelDetails} from '@common/models/actions/models-info.actions';
import {archiveSelectedModels, restoreSelectedModels} from '@common/models/actions/models-menu.actions';
import {archiveSelectedExperiments, restoreSelectedExperiments} from '@common/experiments/actions/common-experiments-menu.actions';

const toCompareEntityType = {
  [EntityTypeEnum.controller]: EntityTypeEnum.experiment,
  [EntityTypeEnum.dataset]: EntityTypeEnum.experiment
};

@Component({
  selector: 'sm-experiments-compare',
  templateUrl: './experiments-compare.component.html',
  styleUrls: ['./experiments-compare.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    ExperimentCompareHeaderComponent,
    TagListComponent,
    MatIconModule,
    PushPipe,
    ChooseColorDirective,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    FormsModule,
    MatMenuTrigger,
    MatDivider,
    RouterLink
  ]
})
export class ExperimentsCompareComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private colorHash = inject(ColorHashService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  protected readonly trackById = trackById;
  private subs = new Subscription();
  public entityTypeEnum = EntityTypeEnum;
  public icons = ICONS;
  public experimentsColor: Record<string, string>;
  private ids: string[];
  public duplicateNamesObject: Record<string, boolean>;
  public selectedTask: { id: string; name: string; tags?: string[]; systemTags?: string[]; system_tags?: string[]; project?: {id: string} };
  public renameValue = '';
  private titleCasePipe = new TitleCasePipe();
  protected readonly entityType = this.activatedRoute.snapshot.data.entityType;
  protected readonly modelsFeature = this.activatedRoute.snapshot.data?.setAllProject;
  protected selectedProject$ = this.store.select(selectSelectedProject);
  protected routeConfig$ = this.store.select(selectRouterConfig);
  protected showGlobalLegend$ = this.store.select(selectShowGlobalLegend);
  protected globalLegendData$ = this.store.select(selectGlobalLegendData);

  constructor() {
    // updating URL with store query params
    if (this.modelsFeature) {
      this.store.dispatch(getCompanyTags());
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.store.dispatch(resetSelectCompareHeader({fullReset: true}));
    this.store.dispatch(setGlobalLegendData({data: null}));
    this.store.dispatch(resetSelectModelState({fullReset: true}));
  }

  ngOnInit(): void {
    this.subs.add(this.selectedProject$.pipe(filter(selectedProject => (this.modelsFeature && !selectedProject))).subscribe(() =>
      this.store.dispatch(setSelectedProject({project: ALL_PROJECTS_OBJECT}))
    ));

    this.subs.add(combineLatest([
      this.routeConfig$,
      this.store.select(selectRouterParams),
      this.store.select(selectSelectedProject)
    ])
      .pipe(
        filter(([, params, project]) => params.ids !== undefined && !!project?.id)
      )
      .subscribe(([conf, params, project]) => {
        this.setupCompareContextMenu(toCompareEntityType[this.entityType] ?? this.entityType, conf[conf[0] === 'datasets' ? 4 : 3], project?.id, params.ids, conf[0]);
      }));

    this.subs.add(this.store.select(selectRouterParams)
      .pipe(
        map(params => params?.ids),
        filter(ids => ids !== undefined),
        distinctUntilChanged(isEqual)
      )
      .subscribe(ids => {
        this.ids = ids.split(',');
        this.store.dispatch(getGlobalLegendData({ids: this.ids, entity: this.entityType}));
      }));

    this.subs.add(this.globalLegendData$.pipe(
      combineLatestWith(this.colorHash.getColorsObservable()),
      filter(([entities]) => !!entities),
      distinctUntilChanged()
    ).subscribe(([entities]) => {
      this.experimentsColor = entities?.reduce((acc, exp) => {
        acc[exp.id] = rgbList2Hex(this.colorHash.initColor(`${exp.name}-${exp.id}`));
        return acc;
      }, {} as Record<string, string>);

      this.duplicateNamesObject = entities.reduce((acc, legendItem) => {
        const experimentName = legendItem.name;
        acc[experimentName] = acc[experimentName] !== undefined;
        return acc;
      }, {} as Record<string, boolean>);
      this.cdr.detectChanges();
    }));

    this.setupBreadcrumbsOptions();
  }

  setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe(
      withLatestFrom(this.store.select(selectProjectType))
    ).subscribe(([selectedProject, projectType]) => {
      const projectTypeBasePath = {
        projects: 'projects',
        datasets: 'datasets/simple',
        pipelines: 'pipelines'
      };
      if (this.modelsFeature) {
        this.store.dispatch(setBreadcrumbsOptions({
          breadcrumbOptions: {
            showProjects: false,
            featureBreadcrumb: {name: 'Models', url: 'models'},
            subFeatureBreadcrumb: {
              name: `Compare ${this.titleCasePipe.transform(this.entityType)}s`
            },
          }
        }));
      } else {
        this.store.dispatch(setBreadcrumbsOptions({
          breadcrumbOptions: {
            showProjects: !!selectedProject,
            featureBreadcrumb: {
              name: this.titleCasePipe.transform(projectType),
              url: projectType
            },
            subFeatureBreadcrumb: {
              name: `Compare ${this.titleCasePipe.transform(this.entityType)}s`
            },
            projectsOptions: {
              basePath: projectTypeBasePath[projectType],
              filterBaseNameWith: null,
              compareModule: null,
              showSelectedProject: selectedProject && selectedProject?.id !== '*',
              ...(selectedProject && {
                selectedProjectBreadcrumb: {
                  name: selectedProject?.id === '*' ? `All ${this.titleCasePipe.transform(this.entityType)}s` : selectedProject?.basename,
                  url: `${projectTypeBasePath[projectType]}/${selectedProject?.id}/${this.entityType === 'model' ? 'model' : 'task'}s`
                }
              })
            }
          }
        }));
      }
    }));
  }

  removeExperiment(exp: { id: string; name: string; tags?: string[]; systemTags?: string[]; system_tags?: string[]; project?: {id: string} }) {
    const newParams = this.ids.filter(id => id !== exp.id).join();
    this.router.navigateByUrl(this.router.url.replace(this.ids.toString(), newParams));
  }

  selectTask(exp: { id: string; name: string; tags?: string[]; systemTags?: string[]; system_tags?: string[]; project?: {id: string} }) {
    this.selectedTask = exp;
  }

  isArchived(exp: { systemTags?: string[]; system_tags?: string[] }) {
    return exp?.systemTags?.includes('archived') || exp?.system_tags?.includes('archived');
  }

  viewTask(exp: { id: string; name: string; tags?: string[]; systemTags?: string[]; system_tags?: string[]; project?: {id: string} }) {
    const urlTree = this.router.createUrlTree(this.buildUrl(exp), {
      queryParams: {archive: this.isArchived(exp) || undefined}
    });
    window.open(this.router.serializeUrl(urlTree), '_blank');
  }

  renameTask(exp: { id: string; name: string }) {
    this.renameValue = exp.name;
    this.dialog.open<RenameDialogComponent>(RenameDialogComponent,{
      data:{
        name: exp.name,
        iconClass: this.entityType === this.entityTypeEnum.model ? 'al-ico-model' : 'al-ico-training',
        header: `RENAME ${this.entityType.toUpperCase()}`,
      },
    }).afterClosed().subscribe(result => {
      if ((result as any)?.name) {
        const newName = result.name?.trim();
        if (newName && newName !== exp.name) {
          if(this.entityType === this.entityTypeEnum.model) {
            this.store.dispatch(updateModelDetails({id: exp.id, changes: {name: newName}}));
          } else {
            this.store.dispatch(experimentDetailsUpdated({id: exp.id, changes: {name: newName}}));
          }
        }
      }
      this.renameValue = '';
    });
  }

  toggleArchive(exp: { id: string; name: string; systemTags?: string[]; system_tags?: string[] }) {
    if (this.isArchived(exp)) {
      if (this.entityType === this.entityTypeEnum.model) {
        this.store.dispatch(restoreSelectedModels({
          selectedEntities: [exp as any],
          skipUndo: true
        }));
      } else {
        this.store.dispatch(restoreSelectedExperiments({
          selectedEntities: [exp as any],
          entityType: this.entityType,
          skipUndo: true
        }));
      }
    } else {
      if (this.entityType === this.entityTypeEnum.model) {
        this.store.dispatch(archiveSelectedModels({
          selectedEntities: [exp as any],
          skipUndo: true
        }));
      } else {
        this.store.dispatch(archiveSelectedExperiments({
          selectedEntities: [exp as any],
          entityType: this.entityType,
          skipUndo: true
        }));
      }
    }
    this.removeExperiment(exp as any);
  }

  setHighlightedTask(id: string) {
    this.store.dispatch(setHighlightedTaskId({taskId: id}));
  }

  clearHighlightedTask() {
    this.store.dispatch(setHighlightedTaskId({taskId: null}));
  }

  closeLegend() {
    this.store.dispatch(setShowGlobalLegend());
  }

  buildUrl(target: { name: string; tags?: string[]; systemTags?: string[], id: string, project?: { id: string } }) {
    const projectOrPipeline = this.activatedRoute.root.firstChild.firstChild.routeConfig.path.replace('datasets', 'datasets/simple/');
    const targetEntity = this.activatedRoute.snapshot.parent.data.entityType === EntityTypeEnum.model ? EntityTypeEnum.model : EntityTypeEnum.experiment;
    return [`/${projectOrPipeline}`, target.project?.id || '*', `${targetEntity}s`, target.id];
  }

  setupCompareContextMenu(comparedEntity, entitiesType, projectId, experiments, base) {
    let contextMenu = comparedEntity === EntityTypeEnum.experiment ? EXPERIMENTS_COMPARE_ROUTES : MODELS_COMPARE_ROUTES;
    contextMenu = contextMenu.map(route => {
      return {
        ...route,
        link: route.header === entitiesType ? undefined : [base === 'datasets' ? 'datasets/simple': base === 'pipelines'? 'pipelines' : 'projects', projectId, `compare-${comparedEntity}s`, {ids: experiments}, route.featureLink ?? route.header],
      };
    });
    this.store.dispatch(headerActions.setTabs({contextMenu, active: entitiesType}));
  }
}
