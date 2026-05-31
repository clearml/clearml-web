import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { ResultLineComponent } from './result-line.component';

describe('ResultLineComponent', () => {
  let component: ResultLineComponent;
  let fixture: ComponentFixture<ResultLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultLineComponent],
      providers: [provideMockStore({})]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultLineComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fontIcon', 'icon-name');
    fixture.componentRef.setInput('label', 'test label');
    fixture.componentRef.setInput('statusOptionsLabels', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
