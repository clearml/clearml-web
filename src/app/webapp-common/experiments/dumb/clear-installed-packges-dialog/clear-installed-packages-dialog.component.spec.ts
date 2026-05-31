import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ClearInstalledPackagesDialogComponent } from './clear-installed-packages-dialog.component';

describe('ClearInstalledPackagesDialogComponent', () => {
  let component: ClearInstalledPackagesDialogComponent;
  let fixture: ComponentFixture<ClearInstalledPackagesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClearInstalledPackagesDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClearInstalledPackagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
