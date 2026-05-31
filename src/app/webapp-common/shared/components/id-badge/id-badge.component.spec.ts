import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdBadgeComponent } from './id-badge.component';

describe('IdBadgeComponent', () => {
  let component: IdBadgeComponent;
  let fixture: ComponentFixture<IdBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ IdBadgeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IdBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
