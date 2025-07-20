import {Subject, Subscription} from 'rxjs';
import {Component, computed, inject, input, OnDestroy} from '@angular/core';
import plotly from 'plotly.js';
import {selectScaleFactor, selectThemeMode} from '@common/core/reducers/view.reducer';
import {Store} from '@ngrx/store';
import {TinyColor} from '@ctrl/tinycolor';
import {explicitEffect} from 'ngxtension/explicit-effect';
import {ChartHoverModeEnum} from '@common/experiments/shared/common-experiments.const';

export const Colors = {
  dark: {
    font: '#e3e2e6',
    lines: '#282c33',
    tick: '#9ea1a8',
    legend: '#bfc7d5',
    icon: '#a1c9ff',
    iconActive: '#fff'
  },
  light: {
    font: '#1a1c1e',
    lines: '#dee1ed',
    tick: '#666',
    legend: '#666',
    icon: '#0060a8',
    iconActive: '#00152c'
  }
};

export interface VisibleExtFrame extends ExtFrame {
  id: string;
}

export interface ExtFrame extends Omit<plotly.Frame, 'data' | 'layout'> {
  iter: number;
  metric: string;
  task: string;
  timestamp: number;
  type: string;
  variant: string;
  variants?: string[];
  worker: string;
  data: ExtData[];
  layout: Partial<ExtLayout>;
  config: Partial<plotly.Config>;
  tags?: string[];
  plot_str?: string;
  colorKey?: string;
  id?: string;
}

export interface ExtLegend extends plotly.Legend {
  valign: 'top' | 'middle' | 'bottom';
  itemwidth: number;
}

export interface ExtLayout extends Omit<plotly.Layout, 'legend'> {
  type: string;
  legend: Partial<ExtLegend>;
  uirevision: number | string;
  name: string;
}

export interface BinaryArray {bdata?: string; dtype?: string}

export interface ExtData extends plotly.PlotData {
  task: string;
  cells: any;
  header: any;
  name: string;
  colorKey?: string;
  isSmoothed: boolean;
  originalMetric?: string;
  fakePlot?: boolean;
  seriesName?: string;
  originalColor?: string;
  fullName?: string;
  x_axis_label?: string;
}

export interface ChartPreferences {
  log?: boolean;
  hoverMode?: ChartHoverModeEnum;
  showSpike?: boolean;
}

@Component({
  selector: 'sm-base-plotly-graph',
  template: '',
  standalone: false
})
export abstract class PlotlyGraphBaseComponent implements OnDestroy {


  store = inject(Store);
  public scaleFactor = this.store.selectSignal(selectScaleFactor);

  protected plotlyElement: plotly.PlotlyHTMLElement;
  protected sub = new Subscription();
  protected colorSub: Subscription;
  public isSmooth = false;
  public shouldRefresh = false;
  protected drawGraph$ = new Subject<{ forceRedraw?: boolean; forceSkipReact?: boolean; noTimer?: boolean }>();
  public alreadyDrawn = false;

  darkTheme = input<boolean>(null);
  isCompare = input(false);
  showOriginals = input(true);

  theme = this.store.selectSignal(selectThemeMode);
  protected isDarkTheme = computed(() => this.darkTheme() ?? this.theme() === 'dark');
  protected themeColors = computed(() => this.isDarkTheme() ? Colors.dark : Colors.light);

  protected constructor() {
    explicitEffect(
      [this.isDarkTheme],
      () => {
        this.shouldRefresh = true;
        this.alreadyDrawn = false;
        this.drawGraph$.next({noTimer: true});
      });
  }

  public _reColorTrace(trace: ExtData, newColor: number[]): void {
    if (Array.isArray(trace.line?.color) || Array.isArray(trace.marker?.color)) {
      return;
    }
    const baseColor = new TinyColor({r: newColor[0], g: newColor[1], b: newColor[2]});
    let colorString: string;
    if (!this.showOriginals()) {
      colorString = baseColor.setAlpha(this.isSmooth ? 0 : 1).toRgbString();
    } else if (this.isSmooth) {
      const hslColor = baseColor.toHsl();
      hslColor.l = (this.isSmooth && !trace.isSmoothed) ? (this.isDarkTheme() ? hslColor.l < 0.20 ? hslColor.l : 20 : hslColor.l > 0.8 ? hslColor.l :80) : 0;
      colorString = new TinyColor(hslColor).toRgbString();
    } else {
      colorString = baseColor.toRgbString();
    }
    if (trace.marker && !(trace.marker.color as BinaryArray)?.bdata) {
      trace.marker.color = colorString;
      if (trace.marker.line) {
        trace.marker.line.color = colorString;
      }
    }
    if (trace.line) {
      trace.line.color = colorString;
    } else {
      // Guess that a graph without a lne or a marker should have a line, may cause havoc
      trace.line = {};
      trace.line.color = colorString;
    }
  }

  public _getTraceColor(trace: ExtData): string {
    if (trace.line) {
      return trace.line.color as string;
    }
    if (trace.marker) {
      return trace.marker.color as string;
    }
    return '';
  }

  public addIdToDuplicateExperiments(chart: ExtFrame): ExtData[] {
    const data = chart.data;
    const taskId = chart.task;
    const namesHash = {};
    for (let i = 0; i < data.length; i++) {
      if (data[0].type === 'parcoords' || !data[i].name || data[i].name === chart.variant || data[i].name.endsWith('</span>') || data[i].name.endsWith(`.${(data[i].task || taskId).substring(0, 6)}`)) {
        continue;
      }
      const name = data[i].name;
      if (namesHash[name] && name !== data[i].legendgroup && data[i].showlegend !== false) {
        namesHash[name].push(i);
      } else {
        namesHash[name] = [i];
      }
    }
    const filtered = Object.entries(namesHash).filter((entry: any) => entry[1].length > 1);
    const duplicateIndexes = filtered.reduce((acc, entry: any) => acc.concat(entry[1]), []);
    const merged = [...duplicateIndexes];

    for (const key of merged) {
      data[key].colorKey = data[key].colorKey ?? data[key].name;
      // Warning: "data[key].task" in compare case. taskId in subplots (multiple plots with same name)
      if (data[key].task || taskId) {
        data[key].name = `${data[key].name}.${(data[key].task || taskId).substring(0, 6)}`;
      }
    }

    // Case all series in plot has same colorKey (same task name)
    const duplicateColorKey = Array.from(new Set(data.map(plot => plot.colorKey))).length < data.filter(plot => !plot.isSmoothed).length;
    if (duplicateColorKey && chart.variants?.length > 0) {
      data.forEach((plot => plot.colorKey = plot.name));
    }

    return data;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.colorSub?.unsubscribe();
  }

}
