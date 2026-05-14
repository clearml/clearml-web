import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetVersionStepComponent } from './dataset-version-step.component';

describe('DatasetVersionStepComponent', () => {
  let component: DatasetVersionStepComponent;
  let fixture: ComponentFixture<DatasetVersionStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DatasetVersionStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetVersionStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('step', { id: 1, stepId: 1, parentIds: [], branchPath: 1, data: {} });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
