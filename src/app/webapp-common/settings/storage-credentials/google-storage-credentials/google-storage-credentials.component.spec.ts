import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { GoogleStorageCredentialsComponent } from './google-storage-credentials.component';

describe('GoogleStorageCredentialsComponent', () => {
  let component: GoogleStorageCredentialsComponent;
  let fixture: ComponentFixture<GoogleStorageCredentialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GoogleStorageCredentialsComponent,
        ReactiveFormsModule
      ],
      providers: [
        FormGroupDirective,
        FormBuilder,
        { provide: MatDialog, useValue: {} }
      ]
    })
    .compileComponents();

    const formGroupDirective = TestBed.inject(FormGroupDirective);
    const fb = TestBed.inject(FormBuilder);
    formGroupDirective.form = fb.group({
      '': fb.group({
        project: [],
        credentials_json: [],
        buckets: fb.array([])
      })
    });

    fixture = TestBed.createComponent(GoogleStorageCredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
