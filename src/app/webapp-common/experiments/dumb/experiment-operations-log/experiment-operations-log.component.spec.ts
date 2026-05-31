import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { ExperimentOperationsLogComponent } from './experiment-operations-log.component';

describe('ResourcesLogComponent', () => {
  let component: ExperimentOperationsLogComponent;
  let fixture: ComponentFixture<ExperimentOperationsLogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExperimentOperationsLogComponent],
      providers: [provideMockStore({})]
    });
    fixture = TestBed.createComponent(ExperimentOperationsLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
