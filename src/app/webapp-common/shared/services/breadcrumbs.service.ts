import {computed, inject, Injectable, signal} from '@angular/core';
import {Store} from '@ngrx/store';
import {combineLatest} from 'rxjs';
import {selectBreadcrumbOptions, selectProjectAncestors} from '@common/core/reducers/projects.reducer';
import {debounceTime, distinctUntilChanged, filter, startWith} from 'rxjs/operators';
import {setBreadcrumbs, setWorkspaceNeutral} from '@common/core/actions/router.actions';
import {isExample} from '@common/shared/utils/shared-utils';
import {CrumbTypeEnum, IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {selectFeatureParam, selectHasProjectId} from '@common/layout/layout.selectors';
import {selectBreadcrumbs} from '@common/core/reducers/view.reducer';
import {Title} from '@angular/platform-browser';
import {ConfigurationService} from '@common/shared/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbsService {
  private store = inject(Store);
  private router = inject(Router);
  public route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private config = inject(ConfigurationService);
  protected staticBreadcrumb = signal(null)
  private title = computed(() => this.config.configuration().branding?.faviconUrl ? '' : 'ClearML');
  private titlePrefix = computed(() => this.title() ? this.title() + ' - ' : '')

  constructor() {
    this.titleService.setTitle(this.title());
    this.store.select(selectBreadcrumbs)
      .pipe(takeUntilDestroyed())
      .subscribe(breadcrumbs => {
        const crumbs = breadcrumbs.flat().filter((breadcrumb => !!breadcrumb?.name)).map(breadcrumb => breadcrumb.name);
        if(crumbs.length > 0) {
          this.titleService.setTitle(`${this.titlePrefix()}${crumbs.join(' / ')}`);
        }
      });

    combineLatest([
      this.store.select(selectHasProjectId).pipe(startWith(false)),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([hasProjectId]) => {
        this.setCrumbs(hasProjectId);
      });


    this.store.select(selectFeatureParam)
      .pipe(
        takeUntilDestroyed(),
        distinctUntilChanged()
      )
      .subscribe(() => {
          this.store.dispatch(setBreadcrumbsOptions({breadcrumbOptions: null}));
        }
      );

    combineLatest([






      this.store.select(selectProjectAncestors),
      this.store.select(selectBreadcrumbOptions)
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(200),
        filter(([projectAncestors, breadcrumbOptions]) => !!breadcrumbOptions && (!breadcrumbOptions.showProjects || projectAncestors !== null)),
      )
      .subscribe(([projectAncestors, breadcrumbOptions]) => {
        const crumbAfterProject = breadcrumbOptions.subFeatureBreadcrumb &&
          (!breadcrumbOptions.subFeatureBreadcrumb.onlyWithProject || projectAncestors?.length > 0);
        const projectCrumb = breadcrumbOptions.projectsOptions?.selectedProjectBreadcrumb;
        this.store.dispatch(setBreadcrumbs({
          breadcrumbs: [
            [breadcrumbOptions.featureBreadcrumb],
            ...([projectAncestors
              ?.filter(ancestor =>
                !breadcrumbOptions.projectsOptions.filterBaseNameWith ||
                !breadcrumbOptions.projectsOptions.filterBaseNameWith.includes(ancestor.basename)
              )
              .map(ancestor => ({
                name: ancestor.basename,
                example: isExample(ancestor),
                url: `${breadcrumbOptions.projectsOptions.basePath}/${ancestor.id}/projects`,
                type: CrumbTypeEnum.Project,
                hidden: ancestor.hidden,
                collapsable: true,
                queryParamsHandling: breadcrumbOptions.projectsOptions.queryParamsHandling
              } as IBreadcrumbsLink))
              .concat(projectCrumb?.url && crumbAfterProject ?
                [{...projectCrumb, type: CrumbTypeEnum.Project, collapsable: true, queryParamsHandling: breadcrumbOptions.projectsOptions.queryParamsHandling} as IBreadcrumbsLink] : []
              )
            ]),
            ...(projectCrumb && !(projectCrumb.url && projectAncestors && crumbAfterProject) ?
                [[{...breadcrumbOptions.projectsOptions.selectedProjectBreadcrumb, queryParamsHandling: breadcrumbOptions.projectsOptions.queryParamsHandling}]] : []
            ),
            ...(breadcrumbOptions.subFeatureBreadcrumb && (!breadcrumbOptions.subFeatureBreadcrumb.onlyWithProject || projectAncestors?.length > 0) ?
                [[breadcrumbOptions.subFeatureBreadcrumb]] : []
            ),
          ]
        }));
      });
  }

  private setCrumbs(hasProjectId: boolean) {
    let route = this.route.snapshot;
    let neutral = false;
    while (route.firstChild) {
      route = route.firstChild;
      if (route.data.workspaceNeutral !== undefined) {
        neutral = route.data.workspaceNeutral;
      }
    }
    const staticBreadcrumb = route?.data?.staticBreadcrumb;
    if (!hasProjectId && staticBreadcrumb) {
      this.store.dispatch(setBreadcrumbs({breadcrumbs: staticBreadcrumb, workspaceNeutral: neutral}));
    } else {
      this.store.dispatch(setWorkspaceNeutral({neutral}));
    }
  }
}
