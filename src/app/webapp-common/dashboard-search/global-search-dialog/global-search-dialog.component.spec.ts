import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ApiProjectsService } from '~/business-logic/api-services/projects.service';
import { ApiDatasetsService } from '~/business-logic/api-services/datasets.service';
import { ApiDataviewsService } from '~/business-logic/api-services/dataviews.service';
import { ApiOrganizationService } from '~/business-logic/api-services/organization.service';
import { ApiModelsService } from '~/business-logic/api-services/models.service';
import { ApiTasksService } from '~/business-logic/api-services/tasks.service';

import { GlobalSearchDialogComponent } from './global-search-dialog.component';
import {ApiReportsService} from '~/business-logic/api-services/reports.service';
import {ApiServingService} from '~/business-logic/api-services/serving.service';
import {ActivatedRoute} from '@angular/router';
import {MatDialogRef} from '@angular/material/dialog';
import {from} from 'rxjs';

describe('GlobalSearchDialogComponent', () => {
  let component: GlobalSearchDialogComponent;
  let fixture: ComponentFixture<GlobalSearchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GlobalSearchDialogComponent,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([])
      ],
      providers: [
        provideMockStore({
          initialState: {
            router: {
              state: {
                url: '',
              }
            },
            search: {},
            users: {
              currentUser: {
                id: '123'
              },
              features: [
                'show_datasets',
                'reports',
                'show_orchestration',
                'resource_dashboard',
                'show_dashboard',
                'config_vault',
                'user_management',
                'permissions',
                'service_users',
                'project_workloads',
                'data_management',
                'tenant_usages',
                'applications',
                'user_management_advanced',
                'show_app_gateways',
                'experiments',
                'app_management',
                'resource_policy',
                'sso_management',
                'queue_management',
                'pipelines',
                'show_projects',
                'model_serving',
                'queues'
              ]
            }
          }
        }),
        { provide: ApiProjectsService, useValue: {} },
        { provide: ApiDatasetsService, useValue: {} },
        { provide: ApiDataviewsService, useValue: {} },
        { provide: ApiOrganizationService, useValue: {} },
        { provide: ApiModelsService, useValue: {} },
        { provide: ApiTasksService, useValue: {} },
        { provide: ApiReportsService, useValue: {} },
        { provide: ApiServingService, useValue: {} },
        { provide: ActivatedRoute, useValue: {
            queryParams: from([{id: 1}]),
            snapshot: {queryParams: {}}
          }},
        { provide: MatDialogRef, useValue: {} },
      ]
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
