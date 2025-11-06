import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Input,
  viewChild,
  viewChildren
} from '@angular/core';
import {Store} from '@ngrx/store';
import {debounceTime} from 'rxjs/operators';
import {ActivatedRoute, Params, RouterLink, UrlTree} from '@angular/router';
import {fromEvent} from 'rxjs';
import {addMessage} from '../../core/actions/layout.actions';
import {ConfigurationService} from '../../shared/services/configuration.service';
import {
  GetCurrentUserResponseUserObjectCompany
} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {selectShowHiddenUserSelection} from '../../core/reducers/projects.reducer';
import {MESSAGES_SEVERITY} from '@common/constants';
import {selectBreadcrumbs, selectWorkspaceNeutral} from '@common/core/reducers/view.reducer';
import {MatMenuModule} from '@angular/material/menu';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ClipboardModule} from 'ngx-clipboard';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {cloneItemIntoDummy} from '@common/shared/utils/shared-utils';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {toSignal} from '@angular/core/rxjs-interop';
import {selectArchive, selectProjectsFeature} from '@common/layout/layout.selectors';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatBadgeModule} from '@angular/material/badge';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';

export enum CrumbTypeEnum {
  Workspace = 'Workspace',
  Feature = 'Feature',
  Project = 'Project',
  SubFeature = 'SubFeature',
}

export interface IBreadcrumbsLink {
  name?: string;
  url?: string | UrlTree;
  urlParams?: Params;
  queryParamsHandling?: 'merge' | 'preserve' | '';
  linkLast?: boolean;
  subCrumbs?: { name?: string; url: string; hidden?: boolean }[];
  isProject?: boolean;
  type?: CrumbTypeEnum;
  hidden?: boolean;
  collapsable?: boolean;
  example?: boolean;
  id?: string;
  tags?: string[];
  badge?: string;
  badgeWarn?: boolean;
  badgeTooltip?: string;
  onlyWithProject?: boolean;
}

export interface IBreadcrumbsOptions {
  showProjects: boolean;
  featureBreadcrumb: IBreadcrumbsLink;
  subFeatureBreadcrumb?: IBreadcrumbsLink;
  projectsOptions?: {
    basePath: string;
    noSubProjectsRedirectPath?: string;
    filterBaseNameWith: string[];
    compareModule: string;
    showSelectedProject: boolean;
    selectedProjectBreadcrumb: IBreadcrumbsLink;
  };
}

@Component({
    selector: 'sm-breadcrumbs',
    templateUrl: './breadcrumbs.component.html',
    styleUrls: ['./breadcrumbs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatMenuModule,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    ClipboardModule,
    RouterLink,
    ClickStopPropagationDirective,
    TagListComponent,
    IdBadgeComponent,
    MatIcon,
    MatIconButton,
    MatBadgeModule
  ]
})
export class BreadcrumbsComponent {
  private store = inject(Store);
  public route = inject(ActivatedRoute);
  private configService = inject(ConfigurationService);
  private cd = inject(ChangeDetectorRef);
  public currentUrl: string;
  public showShareButton = false;
  public subProjectsMenuIsOpen: boolean;

  @Input() activeWorkspace: GetCurrentUserResponseUserObjectCompany;
  protected environment = toSignal(this.configService.getEnvironment());
  private resize = toSignal(fromEvent(window, 'resize').pipe(debounceTime(100)));
  protected projectFeature = this.store.selectSignal(selectProjectsFeature);
  protected showHidden = this.store.selectSignal(selectShowHiddenUserSelection);
  protected workspaceNeutral = this.store.selectSignal(selectWorkspaceNeutral);
  protected archive = this.store.selectSignal<boolean>(selectArchive);
  private routeConfig = this.store.selectSignal(selectRouterConfig);
  protected showArchive = computed(() => this.archive() && !['overview', 'workloads'].includes(this.routeConfig().at(-1)));
  private breadCrumbsContainer = viewChild<ElementRef<HTMLDivElement>>('container');
  private crumbElements=  viewChildren<ElementRef<HTMLDivElement>>('crumb');
  protected breadcrumbLinks = this.store.selectSignal<IBreadcrumbsLink[][]>(selectBreadcrumbs);
  protected breadcrumbs = computed(() => this.breadcrumbLinks()
    .map(breadcrumbsGroup => breadcrumbsGroup?.filter( breadcrumb =>
      (!breadcrumb.hidden) || (this.showHidden() && this.projectFeature())
    ))
    .filter(breadcrumbsGroup => breadcrumbsGroup?.length > 0) ?? []
  );
  protected isCommunity = computed(() => this.environment().communityServer);
  protected shouldCollapse: boolean;


  constructor(
  ) {
    effect(() => {
      this.resize();
      if (this.breadCrumbsContainer()) {
        this.shouldCollapse = false;
        this.cd.detectChanges();
        const lastCrumb = this.crumbElements().at(-1).nativeElement;
        const dummyContainer = document.createElement('span');
        dummyContainer.style.position = 'fixed';
        this.breadCrumbsContainer().nativeElement.appendChild(dummyContainer);
        cloneItemIntoDummy(lastCrumb, dummyContainer);
        const width = dummyContainer.offsetWidth;
        this.breadCrumbsContainer().nativeElement.removeChild(dummyContainer);
        this.shouldCollapse = lastCrumb.clientWidth < width;
        this.cd.markForCheck();
      }
    });

  }

  openShareModal() {
    this.currentUrl = window.location.href;
  }

  copyToClipboardSuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'URL copied successfully'));
  }


  subProjectsMenuOpened(b: boolean) {
    this.subProjectsMenuIsOpen = b;
  }

  copyToClipboard() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'ID copied to clipboard'));
  }
}
