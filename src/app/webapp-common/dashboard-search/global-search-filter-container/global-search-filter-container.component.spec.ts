import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalSearchFilterContainerComponent } from './global-search-filter-container.component';

describe('GlobalSearchFilterContainerComponent', () => {
  let component: GlobalSearchFilterContainerComponent;
  let fixture: ComponentFixture<GlobalSearchFilterContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSearchFilterContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalSearchFilterContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
