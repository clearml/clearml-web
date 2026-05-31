import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

import {DonutComponent} from './donut.component';

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
  chart = { setActiveElements: () => {}, update: () => {} };
}

describe('DonutComponent', () => {
  let component: DonutComponent;
  let fixture: ComponentFixture<DonutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutComponent]
    })
    .overrideComponent(DonutComponent, {
      remove: { imports: [BaseChartDirective] },
      add: { imports: [MockBaseChartDirective] }
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture   = TestBed.createComponent(DonutComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
