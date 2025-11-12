import {
  ChangeDetectionStrategy,
  Component, computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import {DagModelItem} from '@ngneat/dag';
import {combineLatest, fromEvent, Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, mergeMap, takeUntil, tap, throttleTime} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import {selectRouterParams} from '../../core/reducers/router-reducer';
import * as commonInfoActions from '../../experiments/actions/common-experiments-info.actions';
import {
  getSelectedPipelineStep,
  setSelectedPipelineStep,
  StepStatusEnum,
  TreeStep
} from '../../experiments/actions/common-experiments-info.actions';
import {selectPipelineSelectedStepWithFallback} from '../../experiments/reducers';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {getBoxToBoxArrow} from 'curved-arrows';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {selectScaleFactor} from '@common/core/reducers/view.reducer';
import {DagManagerUnsortedService} from '@common/shared/services/dag-manager-unsorted.service';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {uniq} from 'lodash-es';
// import {pipelineDummyConfiguration} from '@common/pipelines-controller/pipeline-controller-info/pipeline-dummydata';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';

export interface PipelineItem extends DagModelItem {
  name: string;
  id: string;
  data: TreeStep;
}

export interface Arrow {
  path: string;
  path2?: string;
  headTransform: string;
  selected: boolean;
  targetId: string;
  sourceId: string;
  outgoing?: boolean;
}

export enum StatusOption {
  log = 'Console',
  code = 'Code',
  content = 'Content',
  preview = 'Preview',
}


@Component({
  selector: 'sm-pipeline-controller-diagram',
  templateUrl: './pipeline-controller-info.component.html',
  styleUrls: ['./pipeline-controller-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DagManagerUnsortedService],
  host: {'(document:keydown)': 'onKeyDown($event)'},
  animations: [
    trigger('shrinkRegular', [
      state('shrink', style({
        opacity: '0',
      })),
      state('regular', style({
        opacity: '1',
      })),
      transition('shrink => regular', [animate('1s')]),
    ]),
  ],
  standalone: false
})
export class PipelineControllerInfoComponent implements OnDestroy {
  private readonly _dagManager = inject(DagManagerUnsortedService<PipelineItem>);
  protected readonly store = inject(Store);
  protected readonly destroyRef = inject(DestroyRef);

  tasksElements = viewChildren('taskEl', {read: ElementRef});
  diagramContainer = viewChild<ElementRef<HTMLDivElement>>('diagramContainer');


  protected readonly statusOption = StatusOption;
  private dragging: boolean;
  public chartWidth = 0;
  public arrows: Arrow[];
  public diagramRect: DOMRect;

  public selectedEntity = signal<PipelineItem>(null);
  protected enableStaging = signal<boolean>(false);
  protected pipelineController: PipelineItem[];
  private skipAutoCenter: boolean;
  private scale = this.store.selectSignal(selectScaleFactor);
  private ratio = computed(() => this.scale() / 100);
  showLog = signal(false);
  public infoData: IExperimentInfo;
  protected stepDiff = signal<string>(null);
  detailsPanelMode = signal(StatusOption.log);
  defaultDetailsMode = StatusOption.log;

  public maximizeResults: boolean;
  protected selected$ = this.store.select(selectPipelineSelectedStepWithFallback);
  protected projectId$ = this.store.select(selectRouterProjectId);

  protected dagModel$ = this._dagManager.dagModel$
    .pipe(filter(model => model?.length > 0), tap(model =>
      model.forEach(row => this.chartWidth = Math.max(this.chartWidth, row.length * 300))));

  protected arrows$: Observable<Arrow[]> = this.dagModel$
    .pipe(
      debounceTime(50),
      map(() => this.drawLines())
    );

  protected highlightedArrows$: Observable<Arrow[]> = combineLatest([
    this.arrows$,
    toObservable(this.selectedEntity)
  ])
    .pipe(map(([arrows, selected]) => this.highlightArrows(arrows, selected)));
  focusOnStage = signal(null);
  focusOnStageId = computed(() => {
    return this.focusOnStage()?.id;
  });
  protected hasStages = signal(false);
  protected shrink = false;


  onKeyDown(e: KeyboardEvent) {
    if ((e.key == 'Escape')) {
      this.showLog = signal(false);
    }
  }

  constructor() {
    this.store.select(selectRouterParams)
      .pipe(
        takeUntilDestroyed(),
        debounceTime(150),
        map(params => this.getEntityId(params)),
        filter(id => !!id),
        distinctUntilChanged()
      )
      .subscribe(id => {
        this.skipAutoCenter = false;
        this.store.dispatch(commonInfoActions.resetExperimentInfo());
        this.store.dispatch(commonInfoActions.getExperimentInfo({id}));
        this.store.dispatch(setSelectedPipelineStep({step: null}));
      });

    combineLatest([this.store.select(selectSelectedExperiment), toObservable(this.enableStaging)])
      .pipe(takeUntilDestroyed())
      .subscribe(([task,]) => {
        if (task?.id !== this.infoData?.id) {
          this.enableStaging.set(false);
          this.focusOnStage.set(false);
          this.selectedEntity.set(null);
          this.stepDiff.set(null);
          this.detailsPanelMode.set(this.getPanelMode());
        }
        this.infoData = task;
        const width = this.diagramContainer()?.nativeElement.getBoundingClientRect().width;
        this.chartWidth = Math.max(Number.isNaN(width) ? 0 : width, 4000);
        const pipelineObject = this.getTreeObject(task);
        this.pipelineController = this.convertPipelineToDagModel(pipelineObject);

        this.resetUninitializedRunningFields();
        this._dagManager.setNewItemsArrayAsDagModel(this.pipelineController);
        window.setTimeout(() => {
          if (!this.skipAutoCenter) {
            const element = this.diagramContainer().nativeElement;
            element.scroll({left: (element.scrollWidth - element.getBoundingClientRect().width) / 2});
          }
        }, 0);

        if (this.selectedEntity()) {
          this.selectStep(this.selectedEntity());
        }
      });

    effect(() => {
      if (this.diagramContainer()) {
        fromEvent(this.diagramContainer().nativeElement, 'wheel')
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            throttleTime(1000)
          )
          .subscribe(() => {
            this.skipAutoCenter = true;
          });

        const mousedown$ = fromEvent(this.diagramContainer().nativeElement, 'mousedown');
        const mouseup$ = fromEvent(document, 'mouseup');
        const mousemove$ = fromEvent(this.diagramContainer().nativeElement, 'mousemove');

        mousedown$
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            mergeMap(() => mousemove$.pipe(
              tap(() => {
                this.dragging = true;
                this.skipAutoCenter = true;
              }),
              map((e: MouseEvent) => {
                e.preventDefault(); // prevent selecting text while dragging
                return {
                  x: e.movementX,
                  y: e.movementY
                };
              }),
              takeUntil(mouseup$)
            ))
          )
          .subscribe(({x, y}: { x: number; y: number }) => {
            this.diagramContainer().nativeElement.scrollTo({
              top: this.diagramContainer().nativeElement.scrollTop - y,
              left: this.diagramContainer().nativeElement.scrollLeft - x,
            });
          });
      }
    });
  }

  protected resetUninitializedRunningFields() {
    if (!this.infoData?.runtime?._pipeline_hash) {
      this.pipelineController.forEach(step => {
        step.data.job_started = null;
        step.data.job_ended = null;
        step.data.status = StepStatusEnum.pending;
      });
    }
  }

  getEntityId(params) {
    return params?.controllerId;
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  convertToStages(pipelineObj) {
    const mergedStages = {};
    Object.keys(pipelineObj).forEach((key) => {
      if (pipelineObj[key].stage) {
        const stageKey = pipelineObj[key].stage;
        mergedStages[stageKey] = {
          parents: [...mergedStages[stageKey]?.parents ?? [], ...pipelineObj[key].parents],
          isStage: true,
        };
      } else {
        mergedStages[key] = pipelineObj[key];
      }
    });


    Object.keys(mergedStages).forEach((key) => {
      const pipelineStepsInStage = Object.entries(pipelineObj).filter(([pipelineKey]) => pipelineObj[pipelineKey].stage === key);
      mergedStages[key] = {
        ...mergedStages[key],
        parents: uniq(mergedStages[key].parents?.map(parent => pipelineObj[parent]?.stage ?? parent).filter(stage => stage !== key)),
        ...(mergedStages[key].isStage && {
          numberOfStepsInStage: pipelineStepsInStage.length,
          statusCount: {
            queued: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.queued).length,
            pending: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.pending).length,
            skipped: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.skipped).length,
            executed: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.executed).length,
            running: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.running).length,
            failed: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.failed).length,
            aborted: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.aborted).length,
            completed: pipelineStepsInStage.filter(([, step]: [string, TreeStep]) => step.status === StepStatusEnum.completed).length,
          },
          computingTime: pipelineStepsInStage.map(([, step]: [string, TreeStep]) => step.job_ended - step.job_started).reduce((a, b) => a + b, 0)
        }),
      };
    });
    return mergedStages;
  }

  convertPipelineToDagModel(pipeline): PipelineItem[] {
    let pipelineObj;
    try {
      pipelineObj = JSON.parse(pipeline);
      // pipelineObj = pipelineDummyConfiguration;
      this.hasStages.set(Object.values(pipelineObj).some((value: TreeStep) => !!value?.stage));
      pipelineObj = Object.entries(pipelineObj).reduce((acc, [key, val]: [string, TreeStep]) => {
        if (!this.focusOnStageId() || val.stage === this.focusOnStageId()) {
          acc[key] = {
            ...val,
            parents: val.parents.map(parent => `${parent}`)
              .filter(parent => !this.focusOnStageId() || pipelineObj[parent].stage === this.focusOnStageId()),
            isStage: false
          };
        }
        return acc;
      }, {});
      if (this.enableStaging()) {
        pipelineObj = this.convertToStages(pipelineObj);
      }

    } catch {
      return [];
    }
    const pipelineKeysArr = Object.keys(pipelineObj).reverse();
    // sort nodes to prevent @ngneat/dag from crashing
    const sortedNodes = [];
    let i = 0;
    while (pipelineKeysArr.length > 0 || i > pipelineKeysArr.length) {
      const node = pipelineObj[pipelineKeysArr[i]];
      const parents = node?.parents ?? [];
      if (parents.every(parent => sortedNodes.includes(parent))) {
        sortedNodes.push(pipelineKeysArr[i]);
        pipelineKeysArr.splice(i, 1);
        i = 0;
        continue;
      }
      i++;
    }
    return sortedNodes.map((key, index) => ({
      id: key,
      stepId: index + 1,
      parentIds: [0].concat(pipelineObj[key].parents.map(parent => sortedNodes.indexOf(parent) + 1)),
      name: key,
      branchPath: 1,
      data: pipelineObj[key],
    } as PipelineItem));
  }

  drawLines() {
    const arrows = [] as Arrow[];
    const pipeLineItems = this._dagManager.getSingleDimensionalArrayFromModel();
    this.diagramRect = this.diagramContainer().nativeElement.getBoundingClientRect();
    pipeLineItems.forEach((pipeLineItem) => {
      pipeLineItem.parentIds.forEach((parentId: number) => {
        if (parentId > 0) {
          const parent: ElementRef<HTMLDivElement> = this.tasksElements().find((b: ElementRef) =>
            parentId === +b.nativeElement.children[0].id
          );
          const self: ElementRef<HTMLDivElement> = this.tasksElements().find(
            (b: ElementRef) => +b.nativeElement.children[0].id === pipeLineItem.stepId
          );
          if (parent?.nativeElement && self?.nativeElement) {
            const fromRect = parent.nativeElement.getBoundingClientRect();
            const toRect = self.nativeElement.getBoundingClientRect();
            const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae] = getBoxToBoxArrow(
              parent.nativeElement.offsetLeft, parent.nativeElement.offsetTop, fromRect.width / this.ratio(), fromRect.height / this.ratio(),
              self.nativeElement.offsetLeft, self.nativeElement.offsetTop, toRect.width / this.ratio(), toRect.height / this.ratio(),
              {padStart: 0, padEnd: 7}
            );
            arrows.push({
              path: `M${sx} ${sy} C${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`,
              headTransform: `translate(${ex},${ey}) rotate(${ae})`,
              selected: false,
              outgoing: false,
              sourceId: `${parentId}`,
              targetId: `${pipeLineItem.stepId}`,
            });
          }
        }
      });
    });
    return arrows;
  }

  protected highlightArrows(arrows: Arrow[], selected: PipelineItem) {
    return arrows?.map(arrow => {
      const isTarget = arrow.targetId === `${selected?.stepId}`;
      const isSource = arrow.sourceId === `${selected?.stepId}`;
      return {...arrow, selected: isTarget || isSource, outgoing: isSource};
    }).sort((a, b) => (a.selected === b.selected) ? 0 : a.selected ? 1 : -1);
  }

  ngOnDestroy(): void {
    this.store.dispatch(commonInfoActions.setExperiment({experiment: null}));
    this.store.dispatch(setSelectedPipelineStep({step: null}));
  }

  selectStep(step?: PipelineItem) {
    if (step) {
      try {
        this.stepDiff.set(JSON.parse(this.infoData.configuration[step.data?.job_code_section || step.id]?.value)?.script?.diff);
      } catch {
        this.stepDiff.set(null);
        if (this.defaultDetailsMode === StatusOption.code) {
          this.detailsPanelMode.set(this.defaultDetailsMode);
        }
      }
      const id = this.infoData.runtime._pipeline_hash ? (step?.data?.job_id) : null;
      if (id) {
        this.store.dispatch(getSelectedPipelineStep({id}));
      } else {
        this.store.dispatch(setSelectedPipelineStep({
          step: {
            id,
            type: step.data.job_type,
            status: step.data.status as unknown as TaskStatusEnum,
            name: step.name
          }
        }));
        this.showLog = signal(false);
      }
      this.selectedEntity.set(step);
    } else if (!this.dragging) {
      this.stepDiff.set(null);
      this.detailsPanelMode.set(this.defaultDetailsMode);
      if(!this.focusOnStage()){
        this.store.dispatch(setSelectedPipelineStep({step: null}));
        this.selectedEntity.set(null);
      }
    } else {
      this.dragging = false;
    }
  }

  openLog(show = true) {
    this.showLog = signal(show);
  }

  toggleResultSize() {
    this.maximizeResults = !this.maximizeResults;
    if (this.detailsPanelMode() === StatusOption.content) {
      this.detailsPanelMode.set(null);
      window.setTimeout(() => {
        this.detailsPanelMode.set(StatusOption.content);
      }, 450);
    }
  }

  protected getTreeObject(task) {
    return task?.configuration?.Pipeline?.value;
  }


  protected getPanelMode() {
    return this.defaultDetailsMode;
  }

  expandStage(step) {
    this.shrink = true;
    this.focusOnStage.set(step);
    this.skipAutoCenter = false;
    this.enableStaging.set(false);
  }

  goBackToStagesMode() {
    this.shrink = false;
    this.focusOnStage.set(undefined);
    this.skipAutoCenter = false;
    this.enableStaging.set(true);
    this.selectStep();
  }

  toggleEnableStaging() {
    this.skipAutoCenter = false;
    this.enableStaging.set(!this.enableStaging());
    if (!this.enableStaging()) {
      this.selectStep();
    }
  }

  expandStageAnimationStarted() {
    this.chartWidth = 0;
  }

  shrinkDone(event) {
    if (event.fromState === 'regular') {
      this.shrink = false;
    }
  }
}
