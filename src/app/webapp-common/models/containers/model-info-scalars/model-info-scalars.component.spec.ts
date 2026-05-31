import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiTasksService } from '~/business-logic/api-services/tasks.service';

import { ModelInfoScalarsComponent } from './model-info-scalars.component';

describe('ModelInfoScalarsComponent', () => {
  let component: ModelInfoScalarsComponent;
  let fixture: ComponentFixture<ModelInfoScalarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelInfoScalarsComponent],
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

    fixture = TestBed.createComponent(ModelInfoScalarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
