import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { BlTasksService } from '~/business-logic/services/tasks.service';
import { ApiQueuesService } from '~/business-logic/api-services/queues.service';
import { ColorHashService } from '@common/shared/services/color-hash/color-hash.service';

import { OpenDatasetVersionMenuComponent } from './open-dataset-version-menu.component';

describe('SimpleDatasetVersionMenuComponent', () => {
  let component: OpenDatasetVersionMenuComponent;
  let fixture: ComponentFixture<OpenDatasetVersionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ OpenDatasetVersionMenuComponent ],
      providers: [
        provideMockStore({}),
        provideRouter([]),
        { provide: BlTasksService, useValue: {} },
        { provide: ApiQueuesService, useValue: {} },
        { provide: ColorHashService, useValue: { getColorForString: () => '#000000' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenDatasetVersionMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('experiment', { id: 'test', tags: [] });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
