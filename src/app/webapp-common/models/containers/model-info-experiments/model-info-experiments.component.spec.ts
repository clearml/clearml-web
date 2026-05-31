import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';

import { ModelInfoExperimentsComponent } from './model-info-experiments.component';

describe('ModelInfoExperimentsComponent', () => {
  let component: ModelInfoExperimentsComponent;
  let fixture: ComponentFixture<ModelInfoExperimentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelInfoExperimentsComponent],
      providers: [
        provideMockStore({}),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelInfoExperimentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
