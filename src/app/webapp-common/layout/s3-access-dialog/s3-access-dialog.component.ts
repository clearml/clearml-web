import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {AdminService} from '~/shared/services/admin.service';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Credentials} from '@common/core/reducers/common-auth-reducer';
import {MatInputModule} from '@angular/material/input';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'sm-s3-access-dialog',
    templateUrl: './s3-access-dialog.component.html',
    styleUrls: ['./s3-access-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatInputModule,
        TooltipDirective,
        SaferPipe,
        MatButton
    ]
})
export class S3AccessDialogComponent {
  public formIsSubmitted: boolean;
  public secured = window.location.protocol === 'https:';
  public s3Form = new FormGroup({
    Key: new FormControl<string>('', [Validators.required]),
    Secret: new FormControl<string>('', [Validators.required]),
    Token: new FormControl<string>(''),
    Region: new FormControl<string>(''),
    Bucket: new FormControl<string>(''),
    Endpoint: new FormControl<string>('')
  });

  isAzure = input<boolean>();
  isGCS = input<boolean>();
  key = input<string>();
  secret = input('');
  region = input('');
  token = input('');
  bucket = input<string>();
  endpoint = input<string>();
  editMode = input(false);
  header = input<string>();
  saveEnabled = input(true);

  closeCancel = output<Credentials>();
  closeSave = output<Credentials>();

  protected adminService = inject(AdminService);

  constructor() {
    effect(() => {
      this.s3Form.patchValue({
        Key     : this.isAzure() ? 'azure' : this.key(),
        Secret  : this.secret(),
        Token   : this.token(),
        Region  : this.region(),
        Bucket  : this.bucket(),
        Endpoint: (this.endpoint() === null || this.endpoint()?.startsWith('http')) ?
          this.endpoint():
           `http${(this.endpoint() as string).endsWith('443') ? 's' : ''}://${this.endpoint()}`,
      });
    });
  }

  public saveNewCredentials() {
    this.formIsSubmitted = true;
    if (this.s3Form.invalid) {
      return false;
    } else {
      this.closeSave.emit(this.s3Form.getRawValue());
      return true;
    }
  }

  public cancel() {
    this.closeCancel.emit(this.s3Form.getRawValue());
  }

}
