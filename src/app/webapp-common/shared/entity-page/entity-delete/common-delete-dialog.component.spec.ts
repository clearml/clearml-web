import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonDeleteDialogComponent, DeleteData } from './common-delete-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { selectNumberOfSourcesToDelete, selectFilesFailedToDelete, selectEntitiesFailedToDelete } from './common-delete-dialog.reducer';
import { resetDeleteState } from './common-delete-dialog.actions';
import { EntityTypeEnum } from '~/shared/constants/non-common-consts';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CommonDeleteDialogComponent', () => {
  let component: CommonDeleteDialogComponent;
  let fixture: ComponentFixture<CommonDeleteDialogComponent>;
  let store: MockStore;
  let dialogRefSpy: { close: any };

  const mockDeleteData: DeleteData = {
    numSelected: 1,
    entity: { id: '123', name: 'test-entity' },
    entityType: EntityTypeEnum.experiment,
    resetMode: false
  };

  beforeEach(async () => {
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CommonDeleteDialogComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectNumberOfSourcesToDelete, value: null },
            { selector: selectFilesFailedToDelete, value: [] },
            { selector: selectEntitiesFailedToDelete, value: [] }
          ]
        }),
        { provide: MAT_DIALOG_DATA, useValue: mockDeleteData },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    store = TestBed.inject(Store) as MockStore;
    fixture = TestBed.createComponent(CommonDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delete files successfully and close dialog', async () => {
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    // Trigger delete
    component.delete();
    fixture.detectChanges();

    // Simulate updates: 4 -> 3 -> 2 -> 1 -> 0
    const steps = [4, 3, 2, 1, 0];

    for (const count of steps) {
      store.overrideSelector(selectNumberOfSourcesToDelete, count);
      store.refreshState();
      fixture.detectChanges();
      await Promise.resolve(); // Flush microtasks for effects
    }

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    expect(dispatchSpy).toHaveBeenCalledWith(resetDeleteState());
  });

  it('should not close dialog if there are failed files', async () => {
    vi.useFakeTimers();
    // Trigger delete
    component.delete();
    fixture.detectChanges();

    // Start with files
    store.overrideSelector(selectNumberOfSourcesToDelete, 4);
    store.refreshState();
    fixture.detectChanges();
    await Promise.resolve();

    // Update to 0 files remaining but with failures
    store.overrideSelector(selectFilesFailedToDelete, ['failed-file.txt']);
    store.overrideSelector(selectNumberOfSourcesToDelete, 0);
    store.refreshState();
    fixture.detectChanges(); // progress hit 100
    await Promise.resolve();

    // Should NOT close immediately
    expect(dialogRefSpy.close).not.toHaveBeenCalled();

    // Wait for timeout (1000ms)
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    await Promise.resolve();

    // Still should not close (it shows finish message instead)
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });
});
