import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeRoutingModule } from './code-routing.module';
import { CodeComponent } from './code.component';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TooltipDirective } from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

@NgModule({
  declarations: [CodeComponent],
  imports: [
    CommonModule,
    CodeRoutingModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    TooltipDirective
  ]
})
export class CodeModule { }
