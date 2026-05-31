import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Directive, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

import {LineChartComponent} from './line-chart.component';

@Directive({
  selector: 'canvas[baseChart]',
  standalone: true
})
class MockBaseChartDirective {
  @Input() type: any;
  @Input() data: any;
  @Input() options: any;
  @Input() plugins: any;
  update() {}
}

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
      providers: [provideMockStore({})]
    })
    .overrideComponent(LineChartComponent, {
      remove: { imports: [BaseChartDirective] },
      add: { imports: [MockBaseChartDirective] }
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture   = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
