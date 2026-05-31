import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { PipelineCardMenuComponent } from './pipeline-card-menu.component';
import {MatMenuModule} from '@angular/material/menu';

describe('PipelineCardMenuComponent', () => {
  let component: PipelineCardMenuComponent;
  let fixture: ComponentFixture<PipelineCardMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PipelineCardMenuComponent,
        MatMenuModule
      ],
      providers: [provideMockStore({})]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineCardMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('project', { tags: [] });
    fixture.componentRef.setInput('allTags', []);
    fixture.detectChanges();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
