import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { MiniTagsListComponent } from './mini-tags-list.component';

describe('MiniTagsListComponent', () => {
  let component: MiniTagsListComponent;
  let fixture: ComponentFixture<MiniTagsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniTagsListComponent],
      providers: [provideMockStore({})]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniTagsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
