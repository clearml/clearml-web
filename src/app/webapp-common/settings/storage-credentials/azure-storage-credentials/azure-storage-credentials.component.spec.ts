import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

import { AzureStorageCredentialsComponent } from './azure-storage-credentials.component';

describe('AzureStorageCredentialsComponent', () => {
  let component: AzureStorageCredentialsComponent;
  let fixture: ComponentFixture<AzureStorageCredentialsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          AzureStorageCredentialsComponent,
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
          containers: fb.array([])
        })
      });

      fixture = TestBed.createComponent(AzureStorageCredentialsComponent);    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
