import {ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, signal} from '@angular/core';
import {CredentialsSettingsActions} from '~/features/settings/settings.actions';
import {Store} from '@ngrx/store';
import {selectCredentials} from '~/features/settings/settings.selectors';
import {UpperCasePipe} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {AzureStorageCredentialsComponent} from '@common/settings/storage-credentials/azure-storage-credentials/azure-storage-credentials.component';
import {GoogleStorageCredentialsComponent} from '@common/settings/storage-credentials/google-storage-credentials/google-storage-credentials.component';
import {AwsStorageCredentialsComponent} from '@common/settings/storage-credentials/aws-storage-credentials/aws-storage-credentials.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-storage-credentials',
    templateUrl: './storage-credentials.component.html',
    styleUrl: './storage-credentials.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatFormFieldModule,
        MatCheckboxModule,
        MatInputModule,
        ReactiveFormsModule,
        AzureStorageCredentialsComponent,
        GoogleStorageCredentialsComponent,
        AwsStorageCredentialsComponent,
        UpperCasePipe,
        MatIconButton,
        MatIcon,
        MatButton,
    ]
})
export class StorageCredentialsComponent {

  private store = inject(Store);
  private fb = inject(FormBuilder);
 private cdr = inject(ChangeDetectorRef);
  protected credentials = this.store.selectSignal(selectCredentials);
  protected selectedStorage = signal<'google' | 'azure' | 'aws'>(null);

  storageForm = this.fb.group({
    aws: this.fb.group({
      key: '',
      secret: '',
      region: '',
      token: '',
      use_credentials_chain: true,
      buckets: this.fb.array([])
    }),
    google: this.fb.group({
      project: '',
      credentials_json: '',
      buckets: this.fb.array([])
    }),
    azure: this.fb.group({
      containers: this.fb.array([])
    })
  });

  constructor() {
    this.store.dispatch(CredentialsSettingsActions.getCredentials());

    effect(() => {
      if (this.credentials()) {
        this.patchForm();
      }
    });
  }

  private patchForm() {
    this.storageForm.patchValue(this.credentials());
    this.awsBuckets.clear({emitEvent: false});
    this.credentials().aws.buckets.forEach(bucket => {
      this.awsBuckets.push(this.createAwsBucket(bucket));
    });
    this.googleBuckets.clear({emitEvent: false});
    this.credentials().google.buckets.forEach(bucket => {
      this.googleBuckets.push(this.createGoogleBucket(bucket));
    });
    this.azureContainers.clear({emitEvent: false});
    this.credentials().azure.containers.forEach(bucket => {
      this.azureContainers.push(this.createAzureContainer(bucket));
    });
    this.cdr.markForCheck();
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
      secure: data.secure,
      region: data.region,
      verify: data.verify,
      use_credentials_chain: data.use_credentials_chain
    });
  }

  createGoogleBucket(data): FormGroup {
    return this.fb.group({
      project: data.project,
      bucket: data.bucket,
      // subdir: data.subdir,
      credentials_json: [data.credentials_json, Validators.required]
    });
  }

  createAzureContainer(data): FormGroup {
    return this.fb.group({
      account_name: data.account_name,
      account_key: data.account_key,
      container_name: data.container_name
    });
  }

  get awsBuckets(): FormArray {
    return this.storageForm.get('aws.buckets') as FormArray;
  }

  get googleBuckets(): FormArray {
    return this.storageForm.get('google.buckets') as FormArray;
  }

  get azureContainers(): FormArray {
    return this.storageForm.get('azure.containers') as FormArray;
  }

  onSubmit(): void {
    this.store.dispatch(CredentialsSettingsActions.updateCredentials({credentials: this.storageForm.value}));
  }

  save() {
    this.store.dispatch(CredentialsSettingsActions.updateCredentials({credentials: this.storageForm.value}));
    this.storageForm.markAsPristine();
  }

  cancelChanges() {
    this.patchForm();
    this.storageForm.markAsPristine();
  }
}
