import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';

import { DashboardReportsComponent } from './dashboard-reports.component';

describe('DashboardReportsComponent', () => {
  let component: DashboardReportsComponent;
  let fixture: ComponentFixture<DashboardReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardReportsComponent],
      providers: [
        provideMockStore({
          initialState: {
            dashboard: { reports: [] }
          }
        }),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
