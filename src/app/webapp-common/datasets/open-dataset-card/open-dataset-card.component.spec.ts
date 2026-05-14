import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { OpenDatasetCardComponent } from './open-dataset-card.component';

describe('SimpleDatasetCardComponent', () => {
  let component: OpenDatasetCardComponent;
  let fixture: ComponentFixture<OpenDatasetCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ OpenDatasetCardComponent ],
      providers: [provideMockStore({})]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenDatasetCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('project', { name: 'test', tags: [] });
    fixture.detectChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
