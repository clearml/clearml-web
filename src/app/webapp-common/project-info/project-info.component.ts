import {
  ChangeDetectionStrategy,
  Component,
  computed, effect, signal, inject, untracked
} from '@angular/core';
import {Store} from '@ngrx/store';
import {combineLatest} from 'rxjs';
import {debounceTime, filter, take} from 'rxjs/operators';
import 'ngx-markdown-editor';
import {
  selectBlockUserScript,
  selectIsDeepMode,
  selectSelectedMetricVariantForCurrProject,
  selectSelectedProject
} from '../core/reducers/projects.reducer';
import {setBreadcrumbsOptions, updateProject} from '../core/actions/projects.actions';
import {isExample} from '../shared/utils/shared-utils';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectThemeMode} from '@common/core/reducers/view.reducer';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {MarkdownEditorComponent} from '@common/shared/components/markdown-editor/markdown-editor.component';
import {MatExpansionPanel, MatExpansionPanelContent, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatButton} from '@angular/material/button';
import {ProjectStatsComponent} from '@common/project-info/conteiners/project-stats/project-stats.component';


@Component({
  selector: 'sm-project-info',
  templateUrl: './project-info.component.html',
  styleUrls: ['./project-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MarkdownEditorComponent,
    MatExpansionPanelTitle,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelContent,
    MatButton,
    ProjectStatsComponent
  ]
})
export class ProjectInfoComponent {
  private store = inject(Store);
  private contextMenuService = inject(HeaderMenuService);
  private archive = injectQueryParams('archive');

  protected blockUserScripts = this.store.selectSignal(selectBlockUserScript);
  public panelOpen = signal(false);
  protected project = this.store.selectSignal(selectSelectedProject);
  protected example = computed(() => isExample(this.project()));
  private projectId = computed(() => this.project()?.id);
  protected info = computed(() => this.project()?.description);
  protected loading = computed(() => !this.project());
  public theme = this.store.selectSignal(selectThemeMode);

  constructor() {
    effect(() => {
      if (this.theme()) {
        Array.from(window.frames).forEach(frame => frame.postMessage('themeChanged', '*'));
      }
    });

    effect(() => {
      if (this.projectId()) {
        untracked(() => this.contextMenuService.setupProjectContextMenu('overview', this.projectId(), this.archive() === 'true'));
      }
    });
    this.setupBreadcrumbsOptions();

    this.store.select(selectSelectedMetricVariantForCurrProject)
      .pipe(
        filter(data => !!data),
        take(1)
      )
      .subscribe(() => {
        this.setMetricsPanel(true);
      });
  }

  setMetricsPanel(open: boolean) {
    this.panelOpen.set(open);
  }

  saveInfo(info: string) {
    this.store.dispatch(updateProject({id: this.projectId(), changes: {description: info}}));
  }

  setupBreadcrumbsOptions() {
    combineLatest([
      this.store.select(selectSelectedProject),
      this.store.select(selectIsDeepMode)
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(0))
      .subscribe(([selectedProject, isDeep]) => this.store.dispatch(
        setBreadcrumbsOptions({
          breadcrumbOptions: {
            showProjects: !!selectedProject,
            featureBreadcrumb: {
              name: 'PROJECTS',
              url: 'projects'
            },
            ...(isDeep && selectedProject?.id !== '*' && {
              subFeatureBreadcrumb: {
                name: 'All Tasks'
              }
            }),
            projectsOptions: {
              basePath: 'projects',
              filterBaseNameWith: null,
              compareModule: null,
              showSelectedProject: selectedProject?.id !== '*',
              ...(selectedProject && {
                selectedProjectBreadcrumb: {
                  name: selectedProject?.id === '*' ? 'All Tasks' : selectedProject?.basename,
                  url: `projects/${selectedProject?.id}/projects`
                }
              })
            }
          }
        })
      ));
  }
}
