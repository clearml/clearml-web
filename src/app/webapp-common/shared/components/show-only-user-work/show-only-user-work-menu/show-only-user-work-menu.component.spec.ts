import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowOnlyUserWorkMenuComponent } from './show-only-user-work-menu.component';

describe('ShowOnlyUserWorkMenuComponent', () => {
  let component: ShowOnlyUserWorkMenuComponent;
  let fixture: ComponentFixture<ShowOnlyUserWorkMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowOnlyUserWorkMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowOnlyUserWorkMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
