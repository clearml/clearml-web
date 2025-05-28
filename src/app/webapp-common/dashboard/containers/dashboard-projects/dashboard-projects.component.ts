import {Component, effect, ElementRef, EventEmitter, inject, Output, viewChild} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {fromEvent} from 'rxjs';
import {Store} from '@ngrx/store';
import {Project} from '~/business-logic/model/projects/project';
import {selectRecentProjects} from '../../common-dashboard.reducer';
import {getRecentProjects} from '../../common-dashboard.actions';
import {ProjectDialogComponent} from '@common/shared/project-dialog/project-dialog.component';
import {resetSelectedProject, setSelectedProjectId} from '@common/core/actions/projects.actions';
import {throttleTime} from 'rxjs/operators';
import {isExample} from '@common/shared/utils/shared-utils';
import {CARDS_IN_ROW} from '../../common-dashboard.const';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
    selector: 'sm-dashboard-projects',
    templateUrl: './dashboard-projects.component.html',
    styleUrls: ['./dashboard-projects.component.scss'],
    standalone: false
})
export class DashboardProjectsComponent {
  private store = inject(Store);
  protected router = inject(Router);
  private matDialog = inject(MatDialog);
  public recentProjectsList$ = this.store.selectSignal(selectRecentProjects);
  private dialog: MatDialogRef<ProjectDialogComponent>;
  readonly cardsInRow = CARDS_IN_ROW;

  @Output() width = new EventEmitter<number>();
  private header = viewChild<ElementRef<HTMLDivElement>>('header');

  constructor() {
    this.store.dispatch(resetSelectedProject());

    effect(() => {
      if (this.header()) {
        this.width.emit(this.header().nativeElement.getBoundingClientRect().width);
      }
    });

    fromEvent(window, 'resize')
      .pipe(
        takeUntilDestroyed(),
        throttleTime(50)
      )
      .subscribe(() => this.width.emit(this.header().nativeElement.getBoundingClientRect().width));
  }


  public projectCardClicked(project: Project) {
    (project.own_tasks===0 && project.sub_projects.length>0) ? this.router.navigateByUrl(`projects/${project.id}/projects`): this.router.navigateByUrl(`projects/${project.id}`);
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
  }

  public openCreateProjectDialog() {
    this.dialog = this.matDialog.open(ProjectDialogComponent, {
      panelClass: 'light-theme',
      data: {
        mode: 'create',
      }
    });
    this.dialog.afterClosed().subscribe(projectHasBeenCreated => {
      if (projectHasBeenCreated) {
        this.store.dispatch(getRecentProjects());
      }
    });
  }
}
