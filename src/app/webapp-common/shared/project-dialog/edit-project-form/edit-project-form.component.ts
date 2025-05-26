import {ChangeDetectionStrategy, Component, computed, effect, EventEmitter, inject, input, Output} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {UniqueProjectValidator} from '@common/shared/project-dialog/unique-project.validator';
import {OutputDestPattern} from '@common/shared/project-dialog/project-dialog.component';
import {ProjectLocationPipe} from '@common/shared/pipes/project-location.pipe';
import {toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, skip} from 'rxjs/operators';
import {minLengthNoSpaces} from '@common/shared/validators/minLengthNoSpaces';


@Component({
    selector: 'sm-edit-project-form',
    templateUrl: './edit-project-form.component.html',
    styleUrls: ['./edit-project-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatInputModule,
        MatProgressSpinnerModule,
        UniqueProjectValidator,
        ReactiveFormsModule
    ]
})
export class EditProjectFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  public readonly projectsRoot = 'Projects root';

  projectForm = this.formBuilder.group({
    name: ['', [Validators.required, minLengthNoSpaces(3)]],
    parent: [{value: null as string, disabled: true}],
    default_output_destination: [{value: null as string, disabled: false}, [Validators.pattern(OutputDestPattern)]],
    system_tags: [[]]
  });

  public loading: boolean;
  public noMoreOptions: boolean;

  valueChanges = toSignal(this.projectForm.valueChanges.pipe(debounceTime(300),skip(1)));
  project = input<Project>();
  parentProjectPath = computed(() => {
    return new ProjectLocationPipe().transform(this.project()?.name)
  });

  @Output() projectUpdated = new EventEmitter();
  @Output() cancelClicked = new EventEmitter();


  constructor() {
    effect(() => {
      this.projectForm.controls.name.setValue(this.project()?.basename ?? '');
      this.projectForm.controls.parent.setValue(this.parentProjectPath());
      this.projectForm.controls.default_output_destination.setValue(this.project()?.default_output_destination);
      this.projectForm.controls.parent.disable();
    });

    effect(() => {
      if (this.valueChanges()) {
        this.projectUpdated.emit({
          ...this.projectForm.getRawValue(),
          ...(this.projectForm.controls.default_output_destination.value === '' && {default_output_destination: null})
        })
      }
    });
  }

  send() {
    this.projectUpdated.emit({
      ...this.projectForm.getRawValue(),
      ...(this.projectForm.controls.default_output_destination.value === '' && {default_output_destination: null})
    });
  }
}

