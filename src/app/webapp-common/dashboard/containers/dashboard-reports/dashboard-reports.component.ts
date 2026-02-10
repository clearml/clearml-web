import {Component, inject} from '@angular/core';
import {ReportCardComponent} from '@common/reports/report-card/report-card.component';
import {PlusCardComponent} from '@common/shared/ui-components/panel/plus-card/plus-card.component';
import {MatIcon} from '@angular/material/icon';
import {Store} from '@ngrx/store';
import {Router, RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {CARDS_IN_ROW} from '@common/dashboard/common-dashboard.const';
import {IReport} from '@common/reports/reports.consts';
import {selectRecentReports} from '@common/dashboard/common-dashboard.reducer';
import {MatAnchor, MatButton} from '@angular/material/button';
import {IReportsCreateRequest, ReportDialogComponent} from '@common/reports/report-dialog/report-dialog.component';
import {createReport} from '@common/reports/reports.actions';
import {selectDefaultNestedModeForFeature} from '@common/core/reducers/projects.reducer';

@Component({
    selector: 'sm-dashboard-reports',
    imports: [
        ReportCardComponent,
        PlusCardComponent,
        MatIcon,
        MatButton,
        MatAnchor,
        RouterLink
    ],
    templateUrl: './dashboard-reports.component.html',
    styleUrl: './dashboard-reports.component.scss'
})
export class DashboardReportsComponent {
  private store = inject(Store);
  protected router = inject(Router);
  private dialog = inject(MatDialog);

  readonly cardsInRow = CARDS_IN_ROW;
  recentList = this.store.selectSignal(selectRecentReports);
  protected defaultNestedModeForFeature = this.store.selectSignal(selectDefaultNestedModeForFeature);

  openCreateDialog() {
    this.dialog.open<ReportDialogComponent, unknown, IReportsCreateRequest>(ReportDialogComponent)
      .afterClosed()
      .subscribe(report => {
        if (report) {
          this.store.dispatch(createReport({reportsCreateRequest: report}));
        }
      });
  }

  cardClicked(report: IReport) {
    this.router.navigate(['/reports', report.project.id, report.id])
  }
}
