import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';

import { MarkdownCheatSheetDialogComponent } from './markdown-cheat-sheet-dialog.component';

describe('MarkdownCheatSheetDialogComponent', () => {
  let component: MarkdownCheatSheetDialogComponent;
  let fixture: ComponentFixture<MarkdownCheatSheetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MarkdownCheatSheetDialogComponent ],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkdownCheatSheetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
