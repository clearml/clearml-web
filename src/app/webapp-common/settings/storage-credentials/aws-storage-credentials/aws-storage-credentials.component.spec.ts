import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

import { AwsStorageCredentialsComponent } from './aws-storage-credentials.component';

describe('AzureStorageCredentialsComponent', () => {
  let component: AwsStorageCredentialsComponent;
  let fixture: ComponentFixture<AwsStorageCredentialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AwsStorageCredentialsComponent,
        ReactiveFormsModule
      ],
      providers: [
        FormGroupDirective,
        FormBuilder
      ]
    })
    .compileComponents();

    const formGroupDirective = TestBed.inject(FormGroupDirective);
    const fb = TestBed.inject(FormBuilder);
    formGroupDirective.form = fb.group({
      '': fb.group({
        key: [],
        secret: [],
        region: [],
        token: [],
        use_credentials_chain: [],
        buckets: fb.array([])
      })
    });

    fixture = TestBed.createComponent(AwsStorageCredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
