import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiTasksService } from '~/business-logic/api-services/tasks.service';

import { ModelInfoPlotsComponent } from './model-info-plots.component';

describe('ModelInfoPlotComponent', () => {
  let component: ModelInfoPlotsComponent;
  let fixture: ComponentFixture<ModelInfoPlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelInfoPlotsComponent],
      providers: [
        provideMockStore({}),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} }
          }
        },
        { provide: ApiTasksService, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelInfoPlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
