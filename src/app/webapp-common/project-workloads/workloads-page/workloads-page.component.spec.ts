import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { ApiOrganizationService } from '~/business-logic/api-services/organization.service';
import { ColorHashService } from '@common/shared/services/color-hash/color-hash.service';

import { WorkloadsPageComponent } from './workloads-page.component';

describe('WorkloadsPageComponent', () => {
  let component: WorkloadsPageComponent;
  let fixture: ComponentFixture<WorkloadsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkloadsPageComponent],
      providers: [
        provideMockStore({
          initialState: {
            rootProjects: { selectedProject: null }
          }
        }),
        provideRouter([]),
        { provide: ApiOrganizationService, useValue: {} },
        { provide: ColorHashService, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkloadsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
