import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { CompareScatterPlotComponent } from './compare-scatter-plot.component';

describe('CompareScatterPlotComponent', () => {
  let component: CompareScatterPlotComponent;
  let fixture: ComponentFixture<CompareScatterPlotComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CompareScatterPlotComponent],
      providers: [provideMockStore({})]
    });
    fixture = TestBed.createComponent(CompareScatterPlotComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('experiments', []);
    fixture.componentRef.setInput('params', [{section: 's', name: 'n'}]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
