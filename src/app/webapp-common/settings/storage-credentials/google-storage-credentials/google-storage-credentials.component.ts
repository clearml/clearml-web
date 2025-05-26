import {ChangeDetectorRef, Component, inject, input, OnInit, output} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule, MatLabel} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {fromEvent} from 'rxjs';
import {take} from 'rxjs/operators';
import {EditJsonComponent, EditJsonData} from '@common/shared/ui-components/overlay/edit-json/edit-json.component';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

type GoogleForm = FormGroup<{
  project: FormControl<string>;
  credentials_json: FormControl<string>;
  buckets: FormArray<FormGroup<{
    project: FormControl<string>,
    bucket: FormControl<string>,
    // subdir: FormControl<string>,
    credentials_json: FormControl<string>
  }>>
}>

@Component({
    selector: 'sm-google-storage-credentials',
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatLabel,
        ReactiveFormsModule,
        MatButton,
        MatIcon,
        MatIconButton,
    ],
    templateUrl: './google-storage-credentials.component.html',
    styleUrls: ['./google-storage-credentials.component.scss', '../storage-credentials.scss']
})
export class GoogleStorageCredentialsComponent implements OnInit {

  private rootFormGroup = inject(FormGroupDirective);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  formGroupName = input('');
  cancelClicked = output();
  save = output();

  form: GoogleForm;

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName()) as FormGroup;
  }

  get googleBuckets(): FormArray {
    return this.form.get('buckets') as FormArray;
  }

  addGoogleBucket(): void {
    this.googleBuckets.push(this.createGoogleBucket({}));
    this.form.markAsDirty();
    this.cdr.detectChanges();
  }

  removeGoogleBucket(index: number): void {
    this.googleBuckets.removeAt(index);
    this.form.markAsDirty();
  }

  createGoogleBucket(data): FormGroup {
    return this.fb.group({
      project: data.project,
      bucket: data.bucket,
      // subdir: data.subdir,
      credentials_json: [data.credentials_json, Validators.required]
    });
  }

  onFileChange(event: Event, index?: number) {
    const file = (event.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    fromEvent(reader, 'load')
      .pipe(take(1))
      .subscribe(() => {
        if (index === undefined) {
          this.form.markAsDirty();
          this.form.patchValue({credentials_json: ((reader.result as string))});
        } else {
          this.form.controls.buckets.controls[index].patchValue({credentials_json: ((reader.result as string))});
        }
        this.form.markAsDirty();
        this.cdr.markForCheck();
      });
  }

  clearFile() {
    this.form.patchValue({credentials_json: ''})
    this.form.markAsDirty();
    }

  clearBucketFile(index: number): void {
    this.form.controls.buckets.controls[index].patchValue({credentials_json: ''})
    this.form.markAsDirty();
  }

  showFile(bucket: {bucket: string; data: string}) {
    let textData;
    try {
      textData = JSON.parse(bucket.data)
    } catch (e) {
      textData = bucket.data
    }
    this.dialog.open<EditJsonComponent, EditJsonData, string>(EditJsonComponent, {
      data: {
        title: `Bucket ${bucket.bucket}`,
        readOnly: true,
        format: 'json',
        textData
      } as EditJsonData
    });
  }

  resetForm() {
    this.form.markAsPristine();
    this.cancelClicked.emit()
  }
}
