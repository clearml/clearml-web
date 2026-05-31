import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniTagComponent } from './mini-tag.component';

describe('MiniTagComponent', () => {
  let component: MiniTagComponent;
  let fixture: ComponentFixture<MiniTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniTagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniTagComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('color', { background: '#000', foreground: '#fff' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
