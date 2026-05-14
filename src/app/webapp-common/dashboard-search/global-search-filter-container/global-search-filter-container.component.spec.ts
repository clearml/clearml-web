import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';

import { GlobalSearchFilterContainerComponent } from './global-search-filter-container.component';

describe('GlobalSearchFilterContainerComponent', () => {
  let component: GlobalSearchFilterContainerComponent;
  let fixture: ComponentFixture<GlobalSearchFilterContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSearchFilterContainerComponent],
      providers: [
        provideMockStore({
          initialState: {
            dashboardSearch: {
              tabsColumnFilters: {},
              searchTags: []
            },
            projects: {
              allUsers: []
            },
            users: {
              currentUser: null
            }
          }
        }),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalSearchFilterContainerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('statusOptions', []);
    fixture.componentRef.setInput('typeOptions', []);
    fixture.componentRef.setInput('showUserFilter', true);
    fixture.componentRef.setInput('statusOptionsLabels', {});
    fixture.componentRef.setInput('isFiltered', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
