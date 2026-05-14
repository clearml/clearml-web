import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { MatDialog } from '@angular/material/dialog';
import { ReportCodeEmbedBaseService } from '@common/shared/services/report-code-embed-base.service';

import { MarkdownEditorComponent } from './markdown-editor.component';

describe('MarkdownEditorComponent', () => {
  let component: MarkdownEditorComponent;
  let fixture: ComponentFixture<MarkdownEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MarkdownEditorComponent ],
      providers: [
        provideMockStore({}),
        { provide: MatDialog, useValue: {} },
        { provide: ReportCodeEmbedBaseService, useValue: { getUrl: () => 'http://localhost' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkdownEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
