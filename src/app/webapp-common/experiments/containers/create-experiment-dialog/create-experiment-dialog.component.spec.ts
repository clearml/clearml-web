import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { CreateExperimentDialogComponent } from './create-experiment-dialog.component';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { selectQueueFeature } from '@common/experiments/shared/components/select-queue/select-queue.reducer';
import { vi } from 'vitest';

(window as any).IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('CreateExperimentDialogComponent', () => {
  let component: CreateExperimentDialogComponent;
  let fixture: ComponentFixture<CreateExperimentDialogComponent>;
  let store: MockStore;
  let dialogRef: any;

  const mockQueues = [
    { id: '1', name: 'default', display_name: 'Default Queue' },
    { id: '2', name: 'gpu', display_name: 'GPU Queue' }
  ];

  beforeEach(async () => {
    dialogRef = {
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CreateExperimentDialogComponent, ReactiveFormsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectQueueFeature.selectQueues, value: mockQueues }
          ]
        }),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(CreateExperimentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.codeFormGroup.get('taskType').value).toBe('training');
      expect(component.codeFormGroup.get('binaryType').value).toBe('python');
      expect(component.codeFormGroup.get('binary').value).toBe('python3');
      expect(component.envFormGroup.get('venvType').value).toBe('discover');
    });

    it('should have required validators on name', () => {
      const nameControl = component.codeFormGroup.get('name');
      nameControl.setValue(null);
      expect(nameControl.valid).toBeFalsy();
      nameControl.setValue('ab'); // minLengthTrimmed(3)
      expect(nameControl.valid).toBeFalsy();
      nameControl.setValue('abc');
      expect(nameControl.valid).toBeTruthy();
    });
  });

  describe('Shell/Python Toggle logic', () => {
    it('should update binary and validators when binaryType changes to shell', () => {
      component.codeFormGroup.get('binaryType').setValue('shell');
      fixture.detectChanges();

      expect(component.shell()).toBeTruthy();
      expect(component.codeFormGroup.get('binary').value).toBe('/bin/bash');
      // Validators are updated in effect, detectChanges handles it
      const binaryControl = component.codeFormGroup.get('binary');
      binaryControl.setValue('not-a-shell');
      expect(binaryControl.valid).toBeFalsy();
      binaryControl.setValue('/bin/zsh');
      expect(binaryControl.valid).toBeTruthy();
    });

    it('should update binary and validators when binaryType changes back to python', () => {
      component.codeFormGroup.get('binaryType').setValue('shell');
      fixture.detectChanges();

      component.codeFormGroup.get('binaryType').setValue('python');
      fixture.detectChanges();

      expect(component.shell()).toBeFalsy();
      expect(component.codeFormGroup.get('binary').value).toBe('python3');
    });
  });

  describe('Form Array manipulations', () => {
    it('should add and remove arguments', () => {
      expect(component.args.length).toBe(0);
      component.addArg();
      expect(component.args.length).toBe(1);
      expect(component.args.at(0).get('key').value).toBe('');

      component.removeArg(0);
      expect(component.args.length).toBe(0);
    });

    it('should add variables', () => {
      expect(component.vars.length).toBe(0);
      component.addVar();
      expect(component.vars.length).toBe(1);
    });
  });

  describe('typeChange', () => {
    it('should set validators on selected git type', () => {
      component.codeFormGroup.patchValue({ repo: 'some-repo' });
      component.typeChange('commit');

      expect(component.codeFormGroup.get('commit').hasValidator(Validators.required)).toBeTruthy();
      expect(component.codeFormGroup.get('branch').hasValidator(Validators.required)).toBeFalsy();
    });
  });

  describe('togglePoetry', () => {
    it('should disable other env controls when poetry is enabled', () => {
      component.togglePoetry(true);
      expect(component.envFormGroup.get('venvType').disabled).toBeTruthy();
      expect(component.envFormGroup.get('requirements').disabled).toBeTruthy();
    });

    it('should enable other env controls when poetry is disabled', () => {
      component.togglePoetry(false);
      expect(component.envFormGroup.get('venvType').enabled).toBeTruthy();
    });
  });

  describe('createDiff', () => {
    it('should create a git diff string', () => {
      component.codeFormGroup.get('script').setValue('test.py');
      const diff = component.createDiff('line1\nline2');
      expect(diff).toContain('diff --git a/test.py b/test.py');
      expect(diff).toContain('+line1');
      expect(diff).toContain('+line2');
      expect(diff).toContain('@@ -0,0 +1,2 @@');
    });
  });

  describe('close', () => {
    it('should close dialog with aggregated form data', () => {
      component.codeFormGroup.patchValue({
        name: 'test experiment',
        script: 'main.py',
        scriptType: 'script'
      });
      component.queueFormGroup.patchValue({ queue: 'default' });

      component.close('save');

      expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({
        action: 'save',
        name: 'test experiment',
        script: 'main.py'
      }));
    });

    it('should prefix script with -m if type is module', () => {
      component.codeFormGroup.patchValue({
        script: 'my.module',
        scriptType: 'module'
      });
      component.close('run');
      expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({
        script: '-m my.module'
      }));
    });

    it('should prefix script with -c if type is shell script', () => {
      component.codeFormGroup.patchValue({
        binaryType: 'shell',
        script: 'echo hello',
        scriptType: 'script'
      });
      fixture.detectChanges();

      component.close('run');
      expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({
        script: '-c echo hello'
      }));
    });
  });

  describe('Queue validation', () => {
    it('should invalidate queue if not in list', () => {
      component.queueFormGroup.get('queue').setValue('invalid-queue');
      fixture.detectChanges();
      expect(component.queueFormGroup.get('queue').valid).toBeFalsy();
    });

    it('should validate queue if in list', () => {
      component.queueFormGroup.get('queue').setValue('default');
      fixture.detectChanges();
      expect(component.queueFormGroup.get('queue').valid).toBeTruthy();
    });
  });
});
