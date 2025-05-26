import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, viewChild} from '@angular/core';
import {get} from 'lodash-es';
import {SelectedModel} from '../../shared/models.model';
import {NA} from '~/app.constants';
import {TAGS} from '@common/tasks/tasks.constants';
import {DatePipe} from '@angular/common';
import {TIME_FORMAT_STRING} from '@common/constants';
import {Store} from '@ngrx/store';
import {activateModelEdit, cancelModelEdit} from '../../actions/models-info.actions';
import {AdminService} from '~/shared/services/admin.service';
import {getSignedUrl} from '@common/core/actions/common-auth.actions';
import {selectSignedUrl} from '@common/core/reducers/common-auth-reducer';
import {filter, map, take} from 'rxjs/operators';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';

@Component({
  selector: 'sm-model-general-info',
  templateUrl: './model-general-info.component.html',
  styleUrls: ['./model-general-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ModelGeneralInfoComponent {
  constructor(private datePipe: DatePipe, private store: Store, private adminService: AdminService) {
  }

  public kpis: { label: string; value: string; downloadable?: boolean; href?: string; task?: string }[];
  private _model: SelectedModel;
  public isLocalFile: boolean;
  protected description = viewChild(InlineEditComponent);

  @Input() editable: boolean;
  @Input() projectId: string;

  @Input() set model(model: SelectedModel) {
    if (this._model?.id !== model?.id) {
      this.description().inlineCanceled();
    }
    this._model = model;
    if (model) {
      this.isLocalFile = this.adminService.isLocalFile(model.uri);
      this.kpis = [
        {label: 'CREATED AT', value: model.created ? (this.datePipe.transform(model.created, TIME_FORMAT_STRING)) : 'NA'},
        {label: 'UPDATED AT', value: model.last_update ? (this.datePipe.transform(model.last_update, TIME_FORMAT_STRING)) : 'NA'},
        {label: 'FRAMEWORK', value: model.framework || NA},
        {label: 'STATUS', value: (model.ready !== undefined) ? (model.ready ? 'Published' : 'Draft') : NA},
        {label: 'MODEL URL', value: model.uri || NA, downloadable: true},
        {label: 'USER', value: get( model,'user.name', NA)},
        {label: 'ARCHIVED', value: model && model.system_tags && model.system_tags.includes(TAGS.HIDDEN) ? 'Yes' : 'No'},
        {label: 'PROJECT', value: get(model, 'project.name', NA)},
      ];
    } else {
      this.kpis = [
        {label: 'CREATED AT', value: '-'},
        {label: 'UPDATED AT', value: '-'},
        {label: 'FRAMEWORK', value: '-'},
        {label: 'STATUS', value: '-'},
        {label: 'MODEL URL', value: '-'},
        {label: 'USER', value: '-'},
        {label: 'ARCHIVED', value: '-'},
        {label: 'PROJECT', value: '-'},
      ];
    }
  }

  get model(): SelectedModel {
    return this._model;
  }

  @Output() commentChanged = new EventEmitter<string>();

  commentValueChanged(value) {
    this.commentChanged.emit(value);
  }

  public canShowModel() {
    return !!this.model && !'Custom'.includes(this.model.framework);
  }

  editExperimentComment(edit) {
    edit && this.store.dispatch(activateModelEdit('ModelComment'));
  }

  cancelEdit() {
    this.store.dispatch(cancelModelEdit());
  }

  downloadModelClicked() {
    const url = this.model.uri;
    this.store.dispatch(getSignedUrl({url}));
    this.store.select(selectSignedUrl(url))
      .pipe(
        filter(signed => !!signed?.signed),
        map(({signed: signedUrl}) => signedUrl),
        take(1)
      ).subscribe(signed => {
      const a = document.createElement('a') as HTMLAnchorElement;
      a.target = '_blank';
      a.href = signed;
      a.click();
    });
  }
}
