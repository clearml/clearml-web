import {ChangeDetectorRef, Component, inject, input, OnInit, output} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule, MatLabel} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

type AzureForm = FormGroup<{
  containers: FormArray<FormGroup<{
    account_name: FormControl<string>,
    account_key: FormControl<string>,
    container_name: FormControl<string>
  }>>
}>

@Component({
    selector: 'sm-azure-storage-credentials',
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatLabel,
        ReactiveFormsModule,
        MatButton,
        MatIcon,
        MatIconButton
    ],
    templateUrl: './azure-storage-credentials.component.html',
    styleUrls: ['./azure-storage-credentials.component.scss', '../storage-credentials.scss']
})
export class AzureStorageCredentialsComponent implements OnInit {

  private rootFormGroup = inject(FormGroupDirective);
  private cdr = inject(ChangeDetectorRef);

  private fb = inject(FormBuilder);
  formGroupName = input('');
  cancelClicked = output();
  save = output();

  form: AzureForm;

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName()) as AzureForm;
    if (this.form.controls.containers.controls.length === 0) {
      this.addAzureBucket();
    }
  }


  get azureContainers(): FormArray {
    return this.form.get('containers') as FormArray;
  }

  addAzureBucket(): void {
    this.azureContainers.push(this.createAzureContainer({}));
    this.form.markAsDirty();
    this.cdr.detectChanges();
  }

  removeAzureBucket(index: number): void {
    this.form.controls.containers.removeAt(index);
    this.form.markAsDirty();
  }

  createAzureContainer(data): FormGroup {
    return this.fb.group({
      account_name: data.account_name,
      account_key: data.account_key,
      container_name: data.container_name,
      id: data.id
    });
  }
}
