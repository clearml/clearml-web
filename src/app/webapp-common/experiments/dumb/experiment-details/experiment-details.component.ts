import {Component, ElementRef, inject, input, Input, viewChild, output } from '@angular/core';
import {FormsModule, UntypedFormControl} from '@angular/forms';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {TIME_FORMAT_STRING} from '@common/constants';
import {Store} from '@ngrx/store';
import {activateEdit, deactivateEdit} from '../../actions/common-experiments-info.actions';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {RouterLink} from '@angular/router';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';
import {NAPipe} from '@common/shared/pipes/na.pipe';
import {FilterInternalPipe} from '@common/shared/pipes/filter-internal.pipe';
import {DatePipe, KeyValuePipe} from '@angular/common';


export const EXPERIMENT_COMMENT = 'ExperimentComment';

@Component({
  selector: 'sm-experiment-details',
  templateUrl: './experiment-details.component.html',
  styleUrls: ['./experiment-details.component.scss'],
  imports: [
    LabeledRowComponent,
    CopyClipboardComponent,
    SectionHeaderComponent,
    EditableSectionComponent,
    FormsModule,
    RouterLink,
    DurationPipe,
    NAPipe,
    FilterInternalPipe,
    DatePipe,
    KeyValuePipe
  ]
})
export class ExperimentDetailsComponent {
  private store = inject(Store);

  commentControl = new UntypedFormControl();
  experimentCommentText: string;
  experimentCommentOriginal: string;

  experimentDescriptionSection = viewChild<EditableSectionComponent>('experimentDescriptionSection');
  descriptionElement = viewChild<ElementRef<HTMLTextAreaElement>>('description');

  experiment = input<IExperimentInfo>();
  editable = input<boolean>();
  isExample = input<boolean>();

  @Input() set experimentComment(experimentComment: string) {
    this.experimentCommentText = experimentComment;
    this.experimentCommentOriginal = experimentComment;
    this.rebuildCommentControl(experimentComment);
  }

  commentChanged = output<string>();
  timeFormatString = TIME_FORMAT_STRING;


  rebuildCommentControl(comment) {
    this.commentControl = new UntypedFormControl(comment);
  }

  commentValueChanged(value) {
    this.commentChanged.emit(value?.trim() ?? null);
    this.editExperimentComment(false);
  }

  onCancelComment() {
    this.experimentCommentText = this.experimentCommentOriginal;
    this.editExperimentComment(false);
  }

  editExperimentComment(edit) {
    if (edit) {
      this.store.dispatch(activateEdit(EXPERIMENT_COMMENT));
    } else {
      this.store.dispatch(deactivateEdit());
    }
  }



  onDescriptionEditMode() {
    this.descriptionElement().nativeElement.focus();
  }
}
