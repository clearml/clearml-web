import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalSearchDialogComponent } from './global-search-dialog.component';

describe('GlobalSearchDialogComponent', () => {
  let component: GlobalSearchDialogComponent;
  let fixture: ComponentFixture<GlobalSearchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSearchDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
