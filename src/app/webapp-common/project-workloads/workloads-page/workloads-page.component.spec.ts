import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkloadsPageComponent } from './workloads-page.component';

describe('WorkloadsPageComponent', () => {
  let component: WorkloadsPageComponent;
  let fixture: ComponentFixture<WorkloadsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkloadsPageComponent]
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
