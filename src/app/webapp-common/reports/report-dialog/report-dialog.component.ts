import {Component, computed, inject, DestroyRef} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {selectTablesFilterProjectsOptions} from '@common/core/reducers/projects.reducer';
import {getTablesFilterProjectsOptions, resetTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {ReportsCreateRequest} from '~/business-logic/model/reports/models';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {
  CreateNewReportFormComponent,
  NewReportData
} from '@common/reports/report-dialog/create-new-report-form/create-new-report-form.component';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

export interface IReportsCreateRequest extends ReportsCreateRequest {
  projectName?: string;
}

@Component({
    selector: 'sm-report-dialog',
    templateUrl: './report-dialog.component.html',
    styleUrls: ['./report-dialog.component.scss'],
    imports: [
        DialogTemplateComponent,
        CreateNewReportFormComponent
    ]
})
export class ReportDialogComponent {
  private readonly store = inject(Store);
  private readonly matDialogRef = inject<MatDialogRef<ReportDialogComponent>>(MatDialogRef<ReportDialogComponent>);
  private readonly destroy = inject(DestroyRef);
  public readonly data = inject<{ defaultProjectId?: string }>(MAT_DIALOG_DATA);
  protected projects = this.store.selectSignal(selectTablesFilterProjectsOptions);
  protected readOnlyProjectsNames = computed(() => this.projects()
    ?.filter(project => isReadOnly(project))
    .map(project => project.name)
  );

  constructor() {
    this.destroy.onDestroy(() => {
      this.store.dispatch(resetTablesFilterProjectsOptions());
    });
  }

  public createReport(reportForm: NewReportData) {
    const report = this.convertFormToReport(reportForm);
    this.matDialogRef.close(report);
  }


  private convertFormToReport(reportForm: NewReportData): IReportsCreateRequest {
    return {
      name: reportForm.name,
      comment: reportForm.description,
      project: reportForm.project.id,
      projectName: reportForm.project.name
    };
  }

  filterSearchChanged($event: { value: string; loadMore?: boolean }) {
    this.store.dispatch(getTablesFilterProjectsOptions({
      searchString: $event.value || '',
      loadMore: $event.loadMore,
      allowPublic: false
    }));
  }
}
