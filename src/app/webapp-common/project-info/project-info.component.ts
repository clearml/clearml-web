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
import {HeaderMenuService} from '@common/shared/services/header-menu.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectThemeMode} from '@common/core/reducers/view.reducer';


@Component({
    selector: 'sm-project-info',
    templateUrl: './project-info.component.html',
    styleUrls: ['./project-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ProjectInfoComponent {
  private store = inject(Store);
  private contextMenuService = inject(HeaderMenuService);

  protected blockUserScripts$ = this.store.select(selectBlockUserScript);
  private selectedProject$ = this.store.select(selectSelectedProject);
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
        untracked(() => this.contextMenuService.setupProjectContextMenu('overview', this.projectId(), false));
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
      this.selectedProject$,
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
