import {ChangeDetectorRef, Component, inject, input, OnInit, output} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule, MatLabel} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

type AWSForm = FormGroup<{
  key: FormControl<string>;
  secret: FormControl<string>;
  region: FormControl<string>;
  token: FormControl<string>;
  use_credentials_chain: FormControl<boolean>;
  buckets: FormArray<FormGroup<{
    bucket: FormControl<string>;
    // subdir: FormControl<string>;
    host: FormControl<string>;
    key: FormControl<string>;
    secret: FormControl<string>;
    token: FormControl<string>;
    // multipart: FormControl<boolean>;
    // acl: FormControl<string>;
    secure: FormControl<boolean>;
    region: FormControl<string>;
    verify: FormControl<boolean>;
    use_credentials_chain: FormControl<boolean>;
  }>>
}>

@Component({
    selector: 'sm-aws-storage-credentials',
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatLabel,
        ReactiveFormsModule,
        MatCheckboxModule,
        TooltipDirective,
        CopyClipboardComponent,
        MatButton,
        MatIcon,
        MatIconButton,
    ],
    templateUrl: './aws-storage-credentials.component.html',
    styleUrls: ['./aws-storage-credentials.component.scss', '../storage-credentials.scss']
})
export class AwsStorageCredentialsComponent implements OnInit {

  private rootFormGroup = inject(FormGroupDirective);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  formGroupName = input('');
  cancelClicked = output();
  save = output();

  form: AWSForm;

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName()) as AWSForm;
  }

  get awsBuckets(): FormArray {
    return this.form.get('buckets') as FormArray;
  }

  addAwsBucket(): void {
    this.awsBuckets.push(this.createAwsBucket({}));
    this.form.markAsDirty();
    this.cdr.detectChanges();
  }

  removeAwsBucket(index: number): void {
    this.awsBuckets.removeAt(index);
    this.form.markAsDirty();
  }

  createAwsBucket(data): FormGroup {
    return this.fb.group({
      bucket: data.bucket,
      // subdir: data.subdir,
      host: data.host,
      key: data.key,
      secret: data.secret,
      token: data.token,
      // multipart: true,
      // acl: data.acl,
      secure: true,
      region: data.region,
      verify: true,
      use_credentials_chain: data.use_credentials_chain,
    });
  }
}
