import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalSearchFilterComponent } from './global-search-filter.component';

describe('GlobalSearchFilterComponent', () => {
  let component: GlobalSearchFilterComponent;
  let fixture: ComponentFixture<GlobalSearchFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSearchFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalSearchFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
