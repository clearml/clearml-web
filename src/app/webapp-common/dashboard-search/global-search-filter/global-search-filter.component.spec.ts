import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { GlobalSearchFilterComponent } from './global-search-filter.component';

describe('GlobalSearchFilterComponent', () => {
  let component: GlobalSearchFilterComponent;
  let fixture: ComponentFixture<GlobalSearchFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSearchFilterComponent],
      providers: [provideMockStore({})]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalSearchFilterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tags', []);
    fixture.componentRef.setInput('filters', {});
    fixture.detectChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
