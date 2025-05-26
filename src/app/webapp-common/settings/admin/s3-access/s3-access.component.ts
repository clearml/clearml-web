import {ChangeDetectionStrategy, Component, forwardRef, inject, input} from '@angular/core';
import {ControlValueAccessor, FormArray, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {ALLEGRO_TUTORIAL_BUCKET} from '~/app.constants';
import {debounceTime} from 'rxjs/operators';
import {ICONS} from '@common/constants';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Credentials} from '@common/core/reducers/common-auth-reducer';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions} from '@angular/material/form-field';

@Component({
    selector: 'sm-s3-access',
    templateUrl: './s3-access.component.html',
    styleUrls: ['./s3-access.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        TooltipDirective,
        MatInput,
        MatFormField,
        MatButton,
        MatIcon,
        MatIconButton
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => S3AccessComponent),
            multi: true
        },
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } as MatFormFieldDefaultOptions }
    ]
})
export class S3AccessComponent implements ControlValueAccessor {
  private formBuilder = inject(FormBuilder);

  onChange: (any) => void;
  onTouched: () => void;
  public secured = window.location.protocol === 'https:';
  readonly ALLEGRO_TUTORIAL_BUCKET = ALLEGRO_TUTORIAL_BUCKET;
  readonly BUCKET_CREDENTIALS      = 'bucketCredentials';
  protected S3Form = this.formBuilder.group({
    bucketCredentials: this.formBuilder.array<Credentials>([]),
  });

  protected ICONS = ICONS;
  externalCredentials = input<Credentials[]>();

  constructor() {
    this.S3Form.valueChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(300)
      )
      .subscribe(() => {
        this.onChange?.(this.S3Form.value);
        this.onTouched?.();
        this.disableTutorialBucket();
      });
  }

  get bucketCredentials() {
    return this.S3Form.controls.bucketCredentials as FormArray;
  }

  addBucket({Key = '', Secret = '', Token='', Region = '', Bucket = '', Endpoint = null} = {}, notify = true) {
    this.bucketCredentials.push(this.formBuilder.group({
      Key,
      Secret,
      Token,
      Region,
      Bucket,
      Endpoint: (Endpoint?.startsWith('http') || Endpoint === null)? Endpoint : `http${Endpoint?.endsWith('443') ? 's' : ''}://${Endpoint}`
    }), {emitEvent: notify});
  }

  removeBucket(index: number) {
    this.bucketCredentials.removeAt(index);
  }

  private buildS3Form(s3Credentials) {
    if (s3Credentials?.bucketCredentials?.length) {
      this.bucketCredentials.clear({emitEvent: false});
      s3Credentials.bucketCredentials.forEach(bucket => {
        this.addBucket(bucket || {}, false);
      });
    }

    this.disableTutorialBucket();
  }

  public disableTutorialBucket() {
    const tutorialBucketIndex = this.S3Form.get(this.BUCKET_CREDENTIALS).value.findIndex(cre =>
      cre.Bucket === this.ALLEGRO_TUTORIAL_BUCKET);
    if (tutorialBucketIndex >= 0) {
      this.S3Form.get(this.BUCKET_CREDENTIALS).get(tutorialBucketIndex.toString()).disable();
    }
  }

  registerOnChange(fn: () => void) {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  writeValue(s3bucketCredentials: {bucketCredentials: Credentials[]}): void {
    this.buildS3Form(s3bucketCredentials);
  }
}
