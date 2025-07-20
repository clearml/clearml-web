import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultLineComponent } from './result-line.component';

describe('ResultLineComponent', () => {
  let component: ResultLineComponent;
  let fixture: ComponentFixture<ResultLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultLineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
