import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnInit, Renderer2,
  ViewChild,
  DOCUMENT, NgZone
} from '@angular/core';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material/dialog';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {Environment} from '../environments/base';
import {getParcoords, getPlot, getSample, getScalar, getSingleValues, paramDecoder, reportsPlotlyReady} from './app.actions';
import {appFeature} from './app.reducer';
import {ExtFrame} from '@common/shared/single-graph/plotly-graph-base';
import {DebugSample} from '@common/shared/debug-sample/debug-sample.reducer';
import {getSignedUrl, setS3Credentials} from '@common/core/actions/common-auth.actions';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {_mergeVariants, allowedMergedTypes, checkIfLegendToTitle, convertMultiPlots, createMultiSingleValuesChart, mergeMultiMetricsGroupedVariant, prepareMultiPlots, tryParseJson} from '@common/tasks/tasks.utils';
import {selectSignedUrl} from '@common/core/reducers/common-auth-reducer';
import {loadExternalLibrary} from '@common/shared/utils/load-external-library';
import {ImageViewerComponent} from '@common/shared/debug-sample/image-viewer/image-viewer.component';
import {cloneDeep, get} from 'lodash-es';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';
import {SingleGraphComponent} from '@common/shared/single-graph/single-graph.component';
import {setCurrentDebugImage} from '@common/shared/debug-sample/debug-sample.actions';
import {isFileserverUrl} from '~/shared/utils/url';
import {
  ExtraTask,
  ParallelCoordinatesGraphComponent
} from '@common/experiments-compare/dumbs/parallel-coordinates-graph/parallel-coordinates-graph.component';
import {EventsGetTaskSingleValueMetricsResponseValues} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseValues';
import {ScalarKeyEnum} from '~/business-logic/model/reports/scalarKeyEnum';
import {ReportsApiMultiplotsResponse} from '@common/constants';
import {DebugSampleModule} from '@common/shared/debug-sample/debug-sample.module';
import {
  SingleValueSummaryTableComponent
} from '@common/shared/single-value-summary-table/single-value-summary-table.component';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {getCompanyServices} from '~/core/actions/auth.actions';
import {DebugImageSnippetComponent} from '@common/shared/debug-sample/debug-image-snippet/debug-image-snippet.component';
import {GraphViewerComponent} from '@common/shared/single-graph/graph-viewer/graph-viewer.component';
import {GraphViewerData} from '@common/shared/single-graph/graph-viewer/graph-viewer.consts';


type WidgetTypes = 'plot' | 'scalar' | 'sample' | 'parcoords' | 'single';

export interface SelectedMetricVariant extends MetricVariantResult {
  valueType?: 'min_value' | 'max_value' | 'value';
}

@Component({
  selector: 'sm-widget-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DebugSampleModule,
    ParallelCoordinatesGraphComponent,
    SingleValueSummaryTableComponent,
    DebugImageSnippetComponent,
    SingleGraphComponent
  ]
})
export class AppComponent implements OnInit {
  private store = inject(Store);
  private configService = inject(ConfigurationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  protected readonly checkIfLegendToTitle = checkIfLegendToTitle;

  protected title = 'report-widgets';
  public plotData: ExtFrame;
  public frame: DebugSample;
  public plotLoaded: boolean;
  private environment: Environment;
  public activated = false;
  private searchParams: URLSearchParams;
  private otherSearchParams: URLSearchParams;
  public type: WidgetTypes;
  public singleGraphHeight;
  public hideMaximize: 'show' | 'hide' | 'disabled' = 'show';
  protected signIsNeeded$ = this.store.selectSignal(appFeature.selectSignIsNeeded);
  protected noPermissions$ = this.store.selectSignal(appFeature.selectNoPermissions);
  protected tasksData = this.store.selectSignal(appFeature.selectTaskData);
  public isDarkTheme = false;
  public externalTool = false;
  public parcoordsData: { experiments: ExtraTask[]; params: { section: string; name: string; }[]; metrics: SelectedMetricVariant[] };
  @ViewChild(SingleGraphComponent) 'singleGraph': SingleGraphComponent;
  public singleValueData: EventsGetTaskSingleValueMetricsResponseValues[];
  public readonly xaxis: ScalarKeyEnum;

  @HostListener('window:resize')
  onResize() {
    this.singleGraph?.redrawPlot();
  }

  constructor() {
    this.store.dispatch(getCompanyServices());
    this.configService.globalEnvironmentObservable.subscribe(env => {
      this.environment = env;
    });
    this.searchParams = new URLSearchParams(window.location.search);
    this.type = this.searchParams.get('type') as WidgetTypes;
    this.singleGraphHeight = window.innerHeight;
    this.otherSearchParams = this.getOtherSearchParams();
    this.xaxis = this.searchParams.get('xaxis') as ScalarKeyEnum;

    try {
      const data = JSON.parse(localStorage.getItem('_saved_state_'));
      if (data.auth) {
        this.store.dispatch(setS3Credentials(data.auth.s3BucketCredentials));
      }
    } catch (e) {
      console.log(e);
    }

  }

  private getOtherSearchParams() {
    const paramsToRemove = ['light', 'type', 'tasks', 'models', 'objects', 'objectType', 'metrics', 'variants', 'iterations', 'company', 'value_type'];
    const otherSearchParams = new URLSearchParams(window.location.search);
    paramsToRemove.forEach(key => {
      otherSearchParams.delete(key);
    });
    return otherSearchParams;
  }

  ngOnInit(): void {
    try {
      if (!(window.top as any).holdIframe) {
        this.activate();
      }
    } catch {
      this.externalTool = true;
      this.hideMaximize = 'hide';
      console.log('no-access-to-parent-window');
      this.activate();
    }

    switch (this.type) {
      case 'plot':
        this.getPlotData();
        break;
      case 'scalar':
        this.getScalars();
        break;
      case 'sample':
        this.getSample();
        break;
      case 'parcoords':
        this.getParallelCoordinate();
        break;
      case 'single':
        this.getSingleValues();
    }

    window.addEventListener('message', (e) => {
      if (e.data == 'renderPlot') {
        this.activate();
      } else if (e.data == 'resizePlot' && this.plotLoaded) {
        this.singleGraph?.redrawPlot();
      } else if (e.data == 'disableMaximize' && this.hideMaximize !== 'hide') {
        this.hideMaximize = 'disabled';
      } else if (e.data === 'themeChanged') {
        this.changeTheme();
      }
    });
    this.changeTheme();
  }

  changeTheme = () => {
    this.renderer.removeClass(this.document.documentElement, `${this.isDarkTheme ? 'dark' : 'light'}-mode`);
    try {
      if (window.top.document.body.parentElement.className) {
        this.isDarkTheme = window.top.document.body.parentElement.classList.contains('dark-mode');
      }
    } catch {
      this.isDarkTheme = this.searchParams.get('light') ? this.searchParams.get('light') === 'false' : !this.isDarkTheme;
    }
    this.renderer.addClass(this.document.documentElement, `${this.isDarkTheme ? 'dark' : 'light'}-mode`);
    this.cdr.markForCheck();
  };

  /// Merging all variants of same metric to same graph. (single experiment)
  mergeVariants = (plots: ReportsApiMultiplotsResponse): Record<string, any> => {
    let previousPlotIsMergable = true;
    return (Object.values(plots) as any).reduce((groupedPlots, pplot) => {
      Object.values(pplot).forEach((exp) => {
        (Object.values(Object.values(exp)[0])[0] as { name: string; plots: MetricsPlotEvent[] }).plots.forEach((plot, index) => {
          const metric = plot.metric;
          groupedPlots[metric] = cloneDeep(groupedPlots[metric]) || null;
          const plotParsed = tryParseJson(plot.plot_str);
          if (plotParsed.data[0] && !plotParsed.data[0].name) {
            plotParsed.data[0].name = plot.variant;
          }
          if (groupedPlots[metric] && allowedMergedTypes.includes(plotParsed?.data?.[0]?.type) && previousPlotIsMergable) {
            groupedPlots[metric].plotParsed = {...groupedPlots[metric].plotParsed, data: _mergeVariants(groupedPlots[metric].plotParsed.data, plotParsed.data)};
          } else {
            // Adding series/variant to title in case SDK didn't do it
            if (!allowedMergedTypes.includes(plotParsed.data[0]?.type) && plotParsed.layout.title !== plot.variant && !plotParsed.layout.title.endsWith(`/${plot.variant}`) && plot.variant && plot.metric) {
              plotParsed.layout.title = `${plotParsed.layout.title} / ${plot.variant}`;
            }
            groupedPlots[metric] = {...plot, plotParsed};
          }
          groupedPlots[metric].variants = groupedPlots[metric].variants ? [...groupedPlots[metric].variants, plot.variant] : [plot.variant];
          previousPlotIsMergable = index > -1 || (index === -1 && allowedMergedTypes.includes(plotParsed.data[0]?.type));
        });
      });
      return groupedPlots;
    }, {});
  };

  private getPlotData() {
    this.store.select(appFeature.selectPlotlyReady).pipe(
      filter(ready => !!ready),
      switchMap(() => this.store.select(appFeature.selectPlotData)),
      filter(plot => !!plot),
      take(1))
      .subscribe((metricsPlots) => {
        this.plotLoaded = true;
        if (this.tasksData().sourceTasks.length < 2) {
          const merged = this.mergeVariants(metricsPlots as ReportsApiMultiplotsResponse);
          this.plotData = {...Object.values(merged)[0], ...Object.values(merged)[0].plotParsed};
        } else {
          const {merged} = prepareMultiPlots(metricsPlots as ReportsApiMultiplotsResponse);
          const newGraphs = convertMultiPlots(merged);
          const originalObject = this.searchParams.get('objects');
          const series = this.searchParams.getAll('series');
          this.plotData = series?.length > 0 ? Object.values(newGraphs)[0].find(a => series.includes((a.data[0] as any).seriesName)) :
            Object.values(newGraphs)[0]?.find(a => originalObject === (a.task ?? a.data[0].task)) ??
            Object.values(newGraphs)[0]?.[0];
        }


        if ((this.plotData?.layout?.images?.length ?? 0) > 0) {
          this.plotData.layout.images.forEach((image: Plotly.Image) => {
              this.store.dispatch(getSignedUrl({
                url: image.source,
                config: {skipFileServer: false, skipLocalFile: false}
              }));
              this.store.select(selectSignedUrl(image.source))
                .pipe(
                  filter(signed => !!signed?.signed),
                  map(({signed: signedUrl}) => signedUrl),
                  take(1)
                ).subscribe(url => {
                image.source = url;
                this.plotLoaded = true;
                this.cdr.markForCheck();
              });
            }
          );
        } else {
          this.plotLoaded = true;
          this.cdr.markForCheck();
        }


      });
  }

  // private isSingleExperiment(metricsPlots: any) {
  //   try {
  //     return Object.keys(Object.values(Object.values(metricsPlots)[0])[0]).length === 1;
  //   } catch (e) {
  //     return false;
  //   }
  // }

  private getScalars() {
    this.store.select(appFeature.selectPlotlyReady).pipe(
      filter(ready => !!ready),
      switchMap(() => this.store.select(appFeature.selectPlotData)),
      filter(plot => !!plot),
      take(1))
      .subscribe(metrics => {
        this.plotLoaded = true;

        const metrics2 = [ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes(this.xaxis) ? this.calcXaxis(metrics) : metrics;

        this.plotData = Object.values(mergeMultiMetricsGroupedVariant(metrics2))?.[0]?.[0];
        this.cdr.markForCheck();
      });
  }

  private getParallelCoordinate() {
    this.store.select(appFeature.selectPlotlyReady).pipe(
      filter(ready => !!ready),
      switchMap(() => this.store.select(appFeature.selectParallelCoordinateData)),
      filter(experiments => !!experiments),
      take(1))
      .subscribe(experiments => {
        this.parcoordsData = {
          experiments,
          metrics: this.searchParams.getAll('metrics').map(metric => {
            const [metricHash, variantHash, valueType] = metric.split('.');
            const path = `${metricHash}.${variantHash}`;
            return {
              metric_hash: metricHash,
              variant_hash: variantHash,
              ...this.findMetricName(path, experiments),
              valueType: valueType ?? this.searchParams.get('value_type')
            } as SelectedMetricVariant;
          }),
          params: this.searchParams.getAll('variants').map(param => paramDecoder(param))
        };
        this.cdr.markForCheck();
      });
  }


  private getSample() {
    this.store.select(appFeature.selectSampleData)
      .pipe(filter(sample => !!sample))
      .subscribe(sample => {
        const url = new URL(sample.url);
        if (isFileserverUrl(sample.url) && this.searchParams.get('company')) {
          url.searchParams.append('tenant', this.searchParams.get('company'));
        }
        const urlDecoded = decodeURI(url.toString()); // decodeURI and not decodeURIComponent
        this.frame = {...sample, url: urlDecoded};
        this.activated = true;
        this.cdr.markForCheck();
        this.store.dispatch(getSignedUrl({url: urlDecoded}));
      });
  }

  private getSingleValues() {
    this.store.select(appFeature.selectSingleValuesData)
      .pipe(
        filter(singleValueData => !!singleValueData),
        take(1)
      ).subscribe(singleValueData => {
      const objects = this.searchParams.getAll('objects');
      if (objects.length > 1) {
        this.type = 'scalar';
        const variants = this.searchParams.getAll('variants');
        let filteredSingleValueData = singleValueData;
        if (variants.length > 0) {
          filteredSingleValueData = singleValueData.map(single => ({...single, values: single.values.filter(val => variants.includes(val.variant))}));
        }
        this.plotData = createMultiSingleValuesChart(filteredSingleValueData);
      } else {
        this.singleValueData = singleValueData[0].values;
      }
      this.cdr.markForCheck();
    });
  }

  activate = async () => {
    this.activated = true;
    await this.waitForVisibility();
    this.singleGraphHeight = window.innerHeight;
    const models = this.searchParams.has('models') || this.searchParams.get('objectType') === 'model';
    const objects = this.searchParams.getAll('objects');
    if ((!['sample', 'single'].includes(this.type) || objects.length > 1)) {
      loadExternalLibrary(this.store, this.environment.plotlyURL, reportsPlotlyReady);
    }
    const queryParams = {
      tasks: objects.length > 0 ? objects : this.searchParams.getAll('tasks'),
      metrics: this.searchParams.getAll('metrics'),
      variants: this.searchParams.getAll('variants'),
      iterations: this.searchParams.getAll('iterations').map(iteration => parseInt(iteration, 10)),
      company: this.searchParams.get('company') || '',
      xaxis: this.searchParams.get('xaxis') || '',
      models
    };

    switch (this.type) {
      case 'plot':
        this.store.dispatch(getPlot({...queryParams, otherSearchParams: this.otherSearchParams}));
        break;
      case 'scalar':
        this.store.dispatch(getScalar({...queryParams, otherSearchParams: this.otherSearchParams}));
        break;
      case 'sample':
        this.store.dispatch(getSample({...queryParams, otherSearchParams: this.otherSearchParams}));
        break;
      case 'parcoords':
        this.store.dispatch(getParcoords({...queryParams, otherSearchParams: this.otherSearchParams}));
        break;
      case 'single':
        this.store.dispatch(getSingleValues({...queryParams, otherSearchParams: this.otherSearchParams}));
        break;
    }
  };


  loadStyle(styleName: string) {
    const head = document.getElementsByTagName('head')[0];

    const themeLink = document.getElementById(
      'client-theme'
    ) as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = styleName;
    } else {
      const style = document.createElement('link');
      style.id = 'client-theme';
      style.rel = 'stylesheet';
      style.href = `${styleName}`;

      head.appendChild(style);
    }
  }

  maximize(data?: GraphViewerData) {
    if (data) {
      this.zone.run(() => {
        this.dialog.open<GraphViewerComponent, GraphViewerData>(GraphViewerComponent, {
          data,
          panelClass: ['image-viewer-dialog', 'full-screen'],
          maxWidth: '100%'
        }).beforeClosed().subscribe(() => window.top.postMessage({
          maximizing: true,
          name: window.name,
          src: window.location.href
        }, '*'));
      });
    }
    this.loadStyle('trains-icons.css');
    window.top.postMessage({
      maximizing: true,
      name: window.name,
      src: window.location.href
    }, '*');
  }

  sampleClicked({src}) {
    this.store.dispatch(setCurrentDebugImage({event: this.frame}));
    this.maximize();
    this.dialog.open(ImageViewerComponent, {
      data: {
        url: src,
        withoutNavigation: true
      },
      panelClass: ['image-viewer-dialog', 'full-screen']
    }).beforeClosed().subscribe(() => this.maximize());
  }

  private findMetricName(metric: string, experiments: ExtraTask[]) {
    const experimentWithCurrentMetric = experiments.find(exp => get(exp.last_metrics, metric));
    const lastMetric = get(experimentWithCurrentMetric.last_metrics, metric) as ExtraTask['last_metrics'];
    return {metric: lastMetric.metric, variant: lastMetric.variant};
  }

  protected navigateToSource() {
    const a = document.createElement('a');
    a.href = this.buildSourceLink(this.searchParams, '*');
    a.target = '_blank';
    a.click();
  }

  private buildSourceLink(searchParams: URLSearchParams, project: string): string {
    const isModels = searchParams.has('models') || this.searchParams.get('objectType') === 'model';
    const objects = searchParams.getAll('objects');
    const variants = searchParams.getAll('variants');
    const metricsPath = searchParams.getAll('metrics');
    let entityIds = objects.length > 0 ? objects : searchParams.getAll(isModels ? 'models' : 'tasks');
    if (entityIds.length === 0 && this.tasksData().sourceTasks.length > 0) {
      entityIds = this.tasksData().sourceTasks.slice(0, 100);
    }
    const isCompare = this.tasksData().sourceTasks.length > 1;
    let url = `${window.location.origin.replace('4201', '4200')}/projects/${project ?? '*'}/`;
    if (isCompare) {
      url += `${isModels ? 'compare-models;ids=' : 'compare-tasks;ids='}${entityIds.filter(id => !!id).join(',')}/${
        this.getComparePath(this.type)}?metricVariants=${encodeURIComponent(metricsPath.join(','))}&metricName=${variants.map(par => `&params=${encodeURIComponent(par)}`).join('')}`;
    } else {
      url += `${isModels ? 'models/' : 'tasks/'}${entityIds}/${this.getOutputPath(isModels, this.type)}`;
    }
    return url;
  }

  private getOutputPath(isModels: boolean, type: WidgetTypes) {
    if (isModels) {
      switch (type) {
        case 'single':
        case 'scalar':
          return 'scalars';
        case 'plot':
          return 'plots';
      }
    } else {
      switch (type) {
        case 'single':
        case 'scalar':
          return 'output/scalars';
        case 'plot':
          return 'output/plots';
        case 'sample':
          return 'output/debugImages';
      }
    }
    return '';
  }

  private getComparePath(type: WidgetTypes) {
    switch (type) {
      case 'single':
      case 'scalar':
        return 'scalars/graph';
      case 'plot':
        return 'metrics-plots';
      case 'parcoords':
        return 'hyper-params/graph';
      case 'sample':
        return 'debug-images';
    }
  }

  private waitForVisibility(): Promise<boolean> {
    return new Promise(resolve => {
      if (window.innerHeight > 0) {
        return resolve(true);
      }

      const observer = new IntersectionObserver(entities => {
        if (entities[0].intersectionRatio > 0) {
          resolve(true);
          observer.disconnect();
        }
      });

      observer.observe(document.body);
    });
  }

  private calcXaxis(metrics: MetricsPlotEvent[] | ReportsApiMultiplotsResponse) {
    return Object.keys(metrics).reduce((groupAcc, groupName) => {
      const group = metrics[groupName];
      groupAcc[groupName] = Object.keys(group).reduce((graphAcc, graphName) => {
        const expGraph = group[graphName];
        graphAcc[graphName] = {};
        Object.keys(expGraph).reduce((graphAcc2, exp) => {
          const graph = expGraph[exp];
          return graphAcc[graphName][exp] = {...graph, x: graph.x.map(ts => new Date(ts))};
        }, {});
        return graphAcc;
      }, {});
      return groupAcc;
    }, {});
  }
}

