import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { OpenDatasetVersionDetailsComponent } from './open-dataset-version-details.component';

describe('SimpleDatasetVersionDetailsComponent', () => {
  let component: OpenDatasetVersionDetailsComponent;
  let fixture: ComponentFixture<OpenDatasetVersionDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ OpenDatasetVersionDetailsComponent ],
      providers: [provideMockStore({})]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenDatasetVersionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
