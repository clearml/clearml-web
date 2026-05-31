import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ApiEventsService } from '~/business-logic/api-services/events.service';
import { ApiProjectsService } from '~/business-logic/api-services/projects.service';
import { ActivatedRoute} from '@angular/router';
import { ApiTasksService } from '~/business-logic/api-services/tasks.service';
import { of } from 'rxjs';

import { OpenDatasetVersionsComponent } from './open-dataset-versions.component';

describe('SimpleDatasetVersionsComponent', () => {
  let component: OpenDatasetVersionsComponent;
  let fixture: ComponentFixture<OpenDatasetVersionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OpenDatasetVersionsComponent,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([])
      ],
      providers: [
        provideMockStore({
          initialState: {
            rootProjects: { selectedProject: null },
            projects: { selectedProject: null },
            view: { projectType: 'datasets' },
            experiments: {
              view: {
                tableCols: [],
                hiddenTableCols: {}
              }
            }
          }
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
                params: { projectId: 'test' },
                queryParams: {},
                data: {},
                firstChild: { firstChild: { routeConfig: { path: '' } } }
            },
            parent: {
                snapshot: { params: { projectId: 'test' } }
            }
          }
        },
        { provide: ApiEventsService, useValue: {} },
        { provide: ApiProjectsService, useValue: {} },
        { provide: ApiTasksService, useValue: { tasksGetAllEx: () => of({ tasks: [] }) } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenDatasetVersionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
