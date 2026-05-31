import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { OpenDatasetVersionContentComponent } from './open-dataset-version-content.component';

describe('SimpleDatasetVersionContentComponent', () => {
  let component: OpenDatasetVersionContentComponent;
  let fixture: ComponentFixture<OpenDatasetVersionContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ OpenDatasetVersionContentComponent ],
      providers: [provideMockStore({})]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenDatasetVersionContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', 'name,size,hash\ntest.txt,100,abc');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
