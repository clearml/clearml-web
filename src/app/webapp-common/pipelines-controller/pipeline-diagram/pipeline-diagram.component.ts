import { Component } from '@angular/core';
import {PipelinesControllerModule} from '@common/pipelines-controller/pipelines-controller.module';
import {PushPipe} from '@ngrx/component';

@Component({
    selector: 'sm-pipeline-diagram',
    imports: [
        PipelinesControllerModule,
        PushPipe
    ],
    templateUrl: './pipeline-diagram.component.html',
    styleUrl: './pipeline-diagram.component.scss'
})
export class PipelineDiagramComponent {

}
