import {Task} from '~/business-logic/model/tasks/task';
import {cloneDeep, isEqual, sortBy} from 'lodash-es';
import plotly, {Config, Layout, PlotData} from 'plotly.js';
import {ExtData, ExtFrame, ExtLayout} from '../shared/single-graph/plotly-graph-base';
import {MetricsPlotEvent} from '../../business-logic/model/events/models';
import {KeyValue} from '@angular/common';
import {EventsGetTaskSingleValueMetricsResponseTasks} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseTasks';
import {maxInArray} from '@common/shared/utils/helpers.util';
import {GroupedList} from '@common/tasks/tasks.model';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {ReportsApiMultiplotsResponse} from '@common/constants';

export interface ExtMetricsPlotEvent extends MetricsPlotEvent {
  variants?: string[];
}

export type IMultiplot = Record<string, Record<number, Record<string, { // experimentId
  name: string;
  plots: ExtFrame[];
}>>>;

export const mergeTasks = (tableTask, task) => {
  task.project = tableTask.project;
  task.user = tableTask.user;
  task.task = tableTask.task;
  return task;
};

export const allowedMergedTypes = ['scatter', 'scattergl', 'bar', 'scatter3d', 'box', 'histogram'];

export const checkIfLegendToTitle = (chartItem: ExtFrame) => {
  const title = typeof chartItem.layout?.title === 'string' ? chartItem.layout?.title : chartItem.layout?.title.text;
  return chartItem && (chartItem.data?.length === 1 || new Set(chartItem.data?.map(c => c.legendgroup)).size === 1 && !title) &&
    (!chartItem.data?.[0].name || chartItem.data?.[0].name === title || !title) && allowedMergedTypes.includes(chartItem?.data?.[0]?.type);
};

export const _mergeVariants = (base: any[], variant) => base.slice().concat(variant);

export const _mergePlotsData = (base: any, toMerge: any) =>
  JSON.stringify({...base, data: _mergeVariants(base.data, toMerge.data)});

export const getModelDesignKey = (modelDes): string => {
  const modelStr = typeof modelDes == 'string';
  if (!modelDes || modelStr) {
    return undefined;
  } else {
    const desKeys = Object.keys(modelDes);
    const firstNonEmptyKey = desKeys.find(key => !!modelDes[key]);
    return firstNonEmptyKey ? firstNonEmptyKey : desKeys[0];
  }
};

export const getModelDesign = (modelDesc: Task['execution']['model_desc']): { key: string; value: any } => {
  const key = getModelDesignKey(modelDesc);
  return {key, value: key ? modelDesc[key] : modelDesc};
};

export const prepareGraph = (data: ExtData[], layout: Partial<ExtLayout>, config: Partial<Config>, graph: Partial<ExtMetricsPlotEvent>): ExtFrame =>
  ({
    data,
    layout,
    config,
    iter: graph.iter,
    metric: graph.metric,
    task: graph.task,
    timestamp: graph.timestamp,
    type: (graph.type ?? Array.isArray(data) ? data[0]?.type : data) as unknown as string,
    variant: graph.variant,
    variants: graph.variants,
    worker: graph['worker'],
    group: null,
    name: null,
    traces: null,
    baseframe: null
  });

export const tryParseJson = (plotString: string): { data: any; layout: any; config?: any } => {
  let parsed: { data: any; layout: any; config?: any };
  try {
    parsed = JSON.parse(plotString);
  } catch (e) {
    parsed = {data: [], layout: {title: 'Unknown data'}};
  }
  return parsed;
};

export const convertPlot = (graph: MetricsPlotEvent, experimentId?: string): { plot: Partial<ExtFrame>; hadError: boolean } => {
  if (!graph?.plot_str) {
    return null;
  }
  const json = tryParseJson(graph.plot_str);
  let hadError;
  if (json.data.length === 0 && json.layout.title === 'Unknown data') {
    hadError = true;
  }
  json.data.task = json.data?.task || experimentId;
  return {plot: prepareGraph(json.data, json.layout, json.config, graph), hadError};
};

export const convertPlots = ({plots, id}: { plots: Record<string, MetricsPlotEvent[]>; id: string }): { graphs: Record<string, ExtFrame[]>; parsingError } => {
  let parsingError: boolean;
  return {
    graphs: Object.entries(plots).sort(([a], [b]) => a.localeCompare(b, undefined, {sensitivity: 'base'})).reduce((acc, [key, graphs]) => {
      acc[key] = graphs?.map(graph => {
        const {plot, hadError} = convertPlot(graph, id);
        parsingError = parsingError || hadError;
        return plot;
      });
      return acc;
    }, {}),
    parsingError
  };
};

export const convertSplitScalars = (scalars: GroupedList, experimentId: string): Record<string, ExtFrame[]> =>
  Object.entries(scalars).reduce((acc, [key, graph]) => {

    const tickformat = getAxisFormat(graph);
    acc[key] = Object.entries(graph).sort((a, b) => a[0] > b[0] ? 1 : -1)
      .map(([variant, data]: [string, ExtData]) => prepareGraph(
        [{
          task: experimentId,
          ...data,
          line: {width: 1, ...data.line},
          type: 'scatter'
        }],
        {type: 'scalar', title: {text: variant}, xaxis: {title: {text: 'Iterations'}}, yaxis: {tickformat}},
        {},
        {metric: key, type: 'scalar', variant, variants: [variant]}
      ));

    return acc;
  }, {});

export const convertScalars = (scalars: GroupedList, experimentId: string): Record<string, ExtFrame[]> =>
  Object.entries(scalars).reduce((acc, [key, graph]) => {

    const chartData = Object.entries(graph).sort((a, b) => a[0] > b[0] ? 1 : -1)
      .map(([, data]: [string, Partial<PlotData>]) => ({
        task: experimentId,
        ...data,
        line: {width: 1, ...data.line},
        type: 'scatter'
      }) as ExtData);

    acc[key] = [prepareGraph(
      chartData,
      {type: 'scalar', title: {text: key}, xaxis: {title: {text: 'Iterations'}}, yaxis: {tickformat: getAxisFormat(graph)}},
      {},
      {metric: key, type: 'scalar', variants: Object.keys(graph)}
    )];
    return acc;
  }, {});

const getAxisFormat = (chartData: Record<string, PlotData>): '.1e' | undefined => {
  const yValues = Object.values(chartData)?.map((trace: ExtData) => (trace.y as number[])).flat() ?? [0];
  const maxY = maxInArray(yValues);
  return maxY >= 1e9 || (maxY < 1e-5 && maxY > 0) ? '.1e' : undefined;
};

function onlySdkFields(parsePlots: { data: any; layout: any; config?: any; metric: string }[]): Record<string, boolean> {
  const sdkFields = ['mode', 'name', 'text', 'type', 'x', 'y'];
  const onlySdk = {};
  parsePlots.forEach(plot => onlySdk[plot.metric] = plot.data.every(data => Object.keys(data).every(field => sdkFields.includes(field))));
  return onlySdk;
}

export const groupIterations = (plots: MetricsPlotEvent[]): Record<string, ExtMetricsPlotEvent[]> => {
  if (!plots.length) {
    return {};
  }

  const sortedPlots = sortBy(plots, 'iter');
  const parsePlots = sortedPlots.map((plot, i) => ({...tryParseJson(plot.plot_str), metric: sortedPlots[i].metric}));
  const onlySdk = onlySdkFields(parsePlots);
  const shouldMerge = shouldBeMerged(parsePlots);
  let previousPlotIsMergable = true;
  return sortedPlots
    .reduce((groupedPlots, plot, i) => {
      const metric = plot.metric;
      groupedPlots[metric] = cloneDeep(groupedPlots[metric]) || [];
      const index = groupedPlots[metric].findIndex((existingGraph) => plot.iter === existingGraph.iter);
      const plotParsed = parsePlots[i];
      if (plotParsed.data[0] && !plotParsed.data[0].name) {
        plotParsed.data[0].name = plot.variant;
      }
      if (index > -1 && plotParsed.data && plotParsed.data[0] && allowedMergedTypes.includes(plotParsed.data[0]?.type) && previousPlotIsMergable) {
        const basePlotParsed = tryParseJson(groupedPlots[metric][index].plot_str);
        groupedPlots[metric][index].plot_str = _mergePlotsData(basePlotParsed, plotParsed);
        groupedPlots[metric][index].variants.push(plot.variant);
      } else {
        // Adding series/variant to title in case SDK didn't do it
        if (!allowedMergedTypes.includes(plotParsed.data[0]?.type) && plotParsed.layout.title !== plot.variant && !plotParsed.layout.title.endsWith(`/${plot.variant}`) && plot.variant && plot.metric) {
          plotParsed.layout.title = `${plotParsed.layout.title} / ${plot.variant}`;
        }
        groupedPlots[metric].push({...plot, plot_str: JSON.stringify(plotParsed), variants: [plot.variant]});
      }
      previousPlotIsMergable = onlySdk[metric] && shouldMerge[metric] && (index > -1 || (index === -1 && allowedMergedTypes.includes(plotParsed.data[0]?.type)));
      return groupedPlots;
    }, {});
};

export const sortMetricsList = (list: string[]) =>
  list ? sortBy(list, item => item.replace(':', '~').toLowerCase()) : list;

export const sortByField = (arr: any[], field: string) =>
  sortBy(arr, item => item[field].replace(':', '~').toLowerCase());

export const sortByFieldSummaryFirst = (arr: any[], field: string) =>
  sortBy(arr, item => item[field].replace(':', '~').replace(/^Summary$/, '   ').toLowerCase());

export const compareByFieldFunc = (field) =>
  (a: KeyValue<string, any>, b: KeyValue<string, any>) =>
    a[field].replace(':', '~').toLowerCase() >
    b[field].replace(':', '~').toLowerCase() ? 1 : -1;

export const mergeMultiMetrics = (metrics): Record<string, ExtFrame[]> => {
  const graphsMap = {};
  Object.keys(metrics ?? {}).forEach(metric => {
    Object.keys(metrics[metric]).forEach(variant => {
      const chartData = Object.entries(metrics[metric][variant])
        .map(([task, data]: [string, ExtData]): ExtData => ({line: {width: 1, ...data.line}, ...data, type: 'scatter', task}));
      const newGraph = prepareGraph(chartData, {
        type: 'multiScalar',
        title: {text: variant}
      }, {}, {metric, variant});
      if (graphsMap[metric]) {
        graphsMap[metric].push(newGraph);
      } else {
        graphsMap[metric] = [newGraph];
      }
    });
  });
  return graphsMap;
};

export const mergeMultiMetricsGroupedVariant = (metrics): Record<string, ExtFrame[]> => {
  const graphsMap = {};
  const onlyOneGraph = Object.keys(metrics).length === 1 && Object.values(metrics).length === 1;
  Object.keys(metrics).forEach(metric => {

    //Search for duplicates names across all metrics and variants
    const duplicateNamesObject = Object.values(Object.assign({}, ...Object.values(metrics).map(a => Object.values(a)).flat())).reduce((acc, legendItem: ExtData) => {
      const experimentName = legendItem.name;
      acc[experimentName] = acc[experimentName] !== undefined;
      return acc;
    }, {} as Record<string, boolean>);

    const chartData = [];
    Object.keys(metrics[metric]).forEach(variant => {
      chartData.push(Object.entries(metrics[metric][variant])
        .map(([taskId, data]: [string, ExtData]) => ({
          ...data,
          type: 'scatter',
          task: taskId,
          colorKey: `${onlyOneGraph ? '' : variant + ' - ' || ''}${data.name}.${taskId.substring(0, 6)}`,
          name: `${variant || '[no name]'} - ${data.name}${duplicateNamesObject[data.name] ? '.' + taskId.substring(0, 6) : ''}`
        }))
      );
    });
    graphsMap[metric] = [prepareGraph((chartData as ExtData[]).flat(), {type: 'multiScalar', title: {text: metric}}, {}, {metric, variant: Object.keys(metrics[metric])[0], variants: Object.keys(metrics[metric])})];
  });
  return graphsMap;
};

export const convertMultiPlots = (plots: Record<string, Record<string, Partial<ExtFrame>>>, tagsLists?: Record<string, string[]>): Record<string, ExtFrame[]> =>
  Object.entries(plots).reduce((acc, graphGroup) => {
    const key = graphGroup[0];
    const graphs = graphGroup[1];
    acc[key] = Object.values(graphs).map(
      graph => {
        const singleTask = new Set(graph.data.map(d => d.task)).size === 1 || graph.data.filter(d => !d.fakePlot).length === 1;
        return {...prepareGraph(graph.data, graph.layout, graph.config, {...graph, task: graph.task}), tags: singleTask ? tagsLists?.[graph.task] ?? [] : []};
      }
    );
    return acc;
  }, {});

export const multiplotsAddChartToGroup = (charts, parsed, metric, experimentName, experiment, experimentId, variant, iteration, showIterationInName: boolean) => {
  let fullName: string;
  const metricVariant = `${metric} - ${variant}`; //isMultipleVar ? `${metric} - ${variant}` : metric;
  if (parsed.layout && parsed.layout.images) {
    if (!charts[metricVariant]) {
      charts[metricVariant] = {};
    }
    const index = Object.keys(charts[metricVariant]).length;
    charts[metricVariant][index] = parsed;
    charts[metricVariant][index].layout.title = showIterationInName ? `${experiment} (iteration ${iteration})` : experiment;
    charts[metricVariant][index].task = experimentId;
    charts[metricVariant][index].metric = metric;
    charts[metricVariant][index].variant = variant;
  }

  // // In case no name set to plot, we invent, so we can split accordingly
  // parsed.data.forEach((varPlot, i) => varPlot.name = varPlot.name || i.toString());

  const isVariantsSplited = (new Set<string>(parsed.data.map(varPlot => varPlot.name))).size > 1;
  const hasSubplots = parsed.layout.xaxis && parsed.layout.xaxis2;

  const allWithoutName = parsed.data.length > 1 && parsed.data.some(plot => !plot.name);
  for (let i = 0; i < parsed.data.length; i++) {
    let isMultipleTasks = false;
    const variantPlot = parsed.data.slice()[i];
    if (!variantPlot) {
      continue;
    }
    const metricName = metricVariant;
    if (!charts[metricName]) {
      charts[metricName] = {};
    }
    variantPlot.legendgroup = experiment;
    if ((!variantPlot.type || allowedMergedTypes.includes(variantPlot.type))) {
      // Overrides user's showlegend: false in compare
      variantPlot.showlegend = true;
      if (variantPlot.name && !hasSubplots) {
        fullName = `${metricVariant} - ${variantPlot.name}`;
      } else {
        fullName = `${metricVariant}`;
      }
      if (isVariantsSplited && !hasSubplots) {
        variantPlot.seriesName = variantPlot.name;
      }
      const iterationString = showIterationInName ? `(iteration ${iteration})` : '';
      variantPlot.name = allWithoutName ? `${experiment} ${iterationString}${i ? ' ' + i : ''}` : `${experiment}${iterationString ? ' ' + iterationString : ''}`;
      variantPlot.colorKey = `${experimentName}-${experimentId}`;
      variantPlot.task = experimentId;
    } else if (variantPlot.type === 'table') {
      variantPlot.name = experiment;
      fullName = `${metricVariant} - ${experiment}`;
      variantPlot.task = experimentId;
    } else {
      fullName = `${metricVariant} - ${experiment}`;
      variantPlot.seriesName = variantPlot.name;
      variantPlot.name = experiment;
      variantPlot.colorKey = `${experimentName}-${experimentId}`;
      variantPlot.task = experimentId;
    }

    if (!charts[metricName][fullName]) {
      charts[metricName][fullName] = Object.assign({}, parsed);
      charts[metricName][fullName].data = [variantPlot];
    } else {
      charts[metricName][fullName].data = _mergeVariants(charts[metricName][fullName].data.slice(), variantPlot);
      charts[metricName][fullName].data?.forEach((dat, i) =>
        //we don't need to show all occurrences of same legend - show only first
        dat.showlegend = charts[metricName][fullName].data.findIndex(p => p.task === dat.task) === i);
      isMultipleTasks = true;
    }
    charts[metricName][fullName].layout = Object.assign({}, {...charts[metricName][fullName].layout}) as Layout;
    // charts[metricName][fullName].layout.title = isMultipleTasks ? variantPlot.seriesName ?? '' : `${experiment} (iteration ${iteration})`;
    charts[metricName][fullName].layout.title = (hasSubplots ? charts[metricName][fullName].layout.title : variantPlot.seriesName || (isMultipleTasks ? '' : variantPlot.name)) || '';
    charts[metricName][fullName].layout.name = charts[metricName][fullName].layout.name ? `${charts[metricName][fullName].layout.name} - ${experiment}` : fullName;
    charts[metricName][fullName].layout.barmode = isMultipleTasks ? 'group' : 'stack';
    charts[metricName][fullName].layout.showlegend = isMultipleTasks ? undefined : charts[metricName][fullName].layout.showlegend;
    charts[metricName][fullName].layout.orientation = isMultipleTasks ? 'h' : charts[metricName][fullName].layout.orientation;
    charts[metricName][fullName].metric = metric;
    charts[metricName][fullName].variant = variant;
    charts[metricName][fullName].iter = isMultipleTasks ? null : charts[metricName][fullName].iter ?? parseInt(iteration);
    charts[metricName][fullName].task = charts[metricName][fullName].task ?? experimentId;
    if (isMultipleTasks && charts[metricName][fullName].layout?.legend?.title) {
      charts[metricName][fullName].layout.legend.title = '';
    }
  }
  return charts;
};

function shouldBeMergedObj(experimentsPlots: Record<string, { data: ExtData[], layout: ExtLayout, config?: plotly.Config }>) {
  const values = Object.values(experimentsPlots).map(plot => ({...plot, metric: ''}));
  return shouldBeMerged(values);
}

function shouldBeMerged(experimentsPlots: { data: ExtData[], layout: ExtLayout, config?: plotly.Config; metric: string }[]): Record<string, boolean> {
  const shouldMerge = {};
  experimentsPlots.forEach((plot) => shouldMerge[plot.metric] = plot.data.length > 0 && plot.data.every(data => allowedMergedTypes.includes(data.type)));
  experimentsPlots.forEach((plot) => {
    const cleanFirstPlotLayout = {...experimentsPlots[0].layout, title: '', xaxis: {...experimentsPlots[0].layout.xaxis, title: ''}, yaxis: {...experimentsPlots[0].layout.yaxis, title: ''}};
    const cleanPlotLayout = {...plot.layout, title: '', xaxis: {...plot.layout.xaxis, title: ''}, yaxis: {...plot.layout.yaxis, title: ''}};
    shouldMerge[plot.metric] = shouldMerge[plot.metric] || isEqual(cleanFirstPlotLayout, cleanPlotLayout);
  });
  return shouldMerge;
}

export const seperateMultiplotsVariants = (mixedPlot: IMultiplot, isMultipleVarients, duplicateNamesObject: Record<string, boolean>): { charts: IMultiplot; parsingError: boolean } => {
  let charts = {};
  let parsingError: boolean;
  const values = Object.values(mixedPlot);
  if (!values || values.length === 0) {
    return {charts: mixedPlot, parsingError: false};
  }

  const showIterationInName = values.some(a => Object.values(a).some(b => Object.keys(b).some(c => c !== '0')));
  for (const variant of values) {
    const experimentsPlots = Object.entries(variant).reduce((acc, [experimentId, experimentData]) => {
      const iterationKey = Object.keys(experimentData)[0];
      const iteration = experimentData[iterationKey] as { name: string, plots: ExtFrame[] };
      const plot = iteration.plots[0];
      acc[experimentId] = tryParseJson(plot.plot_str);
      return acc;
    }, {} as Record<string, { data: ExtData[], layout: ExtLayout, config?: plotly.Config }>);
    Object.entries(variant).map(([experimentId, experimentData]) => {
      const shortExpId = experimentId.substring(0, 6);

      const iterationKey = Object.keys(experimentData)[0];
      const iteration: { name: string, plots: ExtFrame[] } = (experimentData[iterationKey]);
      const experimentName = duplicateNamesObject[iteration.name] ? iteration.name + '.' + shortExpId : iteration.name;
      const plot = iteration.plots[0];
      const parsed: { data: ExtData[], layout: ExtLayout, config?: plotly.Config } = experimentsPlots[experimentId] ?? tryParseJson(plot.plot_str);
      const title = typeof parsed.layout.title === 'object' ? parsed.layout.title?.text : (parsed.layout.title as string);
      if (parsed.data.length === 0 && (title === 'Unknown data')) {
        parsingError = true;
      }
      if (shouldBeMergedObj(experimentsPlots)) {
        charts = multiplotsAddChartToGroup(charts, parsed, plot.metric, iteration.name, experimentName, experimentId, plot.variant, iterationKey, showIterationInName);
      } else {
        charts[`${plot.metric} - ${plot.variant}`] = charts[`${plot.metric} - ${plot.variant}`] ?? {};
        const plotObj = {...parsed, metric: plot.metric, variant: plot.variant, task: experimentId};
        plotObj.layout.showlegend = true;
        plotObj.layout.title = {text: `${experimentName} (iteration ${iterationKey})`};
        plotObj.data.forEach((p, i) => {
          p.colorKey = `${p.name ?? experimentName}-${experimentId}`;
          p.name = p.name ?? `series ${i + 1}`;
        });
        charts[`${plot.metric} - ${plot.variant}`][`${plot.metric} - ${plot.variant} - ${experimentName}`] = plotObj;
      }
    });
  }

  return {charts, parsingError};
};

function removeRedundantExperiments(multiPlots: ReportsApiMultiplotsResponse, experimentsIds: string[]) {
  if (experimentsIds.length === 0) {
    return multiPlots;
  }
  // When we remove experiment form the list, don't call BE, just remove it from plots data
  return Object.entries(multiPlots).reduce((acc, [metric, variant]) => {
    acc[metric] = Object.entries(variant).reduce((acc1, [variantName, exps]) => {
      acc1[variantName] = Object.entries(exps).reduce((acc2, [expId, plot]) => {
        if (experimentsIds.includes(expId)) {
          acc2[expId] = plot;
        }
        return acc2;
      }, {});
      return acc1;
    }, {});
    return acc;
  }, {});
}

export const prepareMultiPlots = (multiPlots: ReportsApiMultiplotsResponse, globalLegend: Partial<ISelectedExperiment>[] = []): { merged: ReportsApiMultiplotsResponse; parsingError: boolean } => {
  let hadParsingError = false;
  if (!multiPlots) {
    return {merged: multiPlots, parsingError: false};
  }

  const experimentsIds = globalLegend.map(g => g.id);
  const newMultiPlots = removeRedundantExperiments(multiPlots, experimentsIds);

  const idToName = {};
  const duplicateNamesObject = globalLegend.reduce((acc, legendItem) => {
    const experimentName = legendItem.name;
    acc[experimentName] = acc[experimentName] !== undefined;
    idToName[legendItem.id] = experimentName;
    return acc;
  }, {} as Record<string, boolean>);

  const merged = Object.entries(newMultiPlots).reduce((acc, graph) => {
    if (!graph[1]) {
      return acc;
    }
    const isMultipleVarients = Object.keys(graph[1]).length > 1;
    const {charts, parsingError} = seperateMultiplotsVariants(graph[1] as IMultiplot, isMultipleVarients, duplicateNamesObject);
    addMissingExperimentsToPlots(charts, idToName);
    const graphsPerVariant = charts;
    hadParsingError = hadParsingError || parsingError;
    return {...acc, ...graphsPerVariant};
  }, {});
  return {merged, parsingError: hadParsingError};
};

function addMissingExperimentsToPlots(charts, idToName) {
  Object.values(charts as any).forEach(variant => Object.values(variant).forEach(plot => {
    const multiVariant = Object.keys(variant).length > 1;
    if (!plot.layout?.images && plot.data?.[0]?.type !== 'table') {
      // (WIP) We should deal with overriding user legend false before
      plot.data.filter(data => data.showlegend === false).forEach(data => {
        data.visible = true;
        // data.showlegend = true;
      });
      const existsTasksIds = (plot.data).map(data => data.task);
      Object.keys(idToName).forEach(taskId => {
        if (!existsTasksIds.includes(taskId)) {
          // For plots that only one experiment involve, we need to remove the title (We deal with multiple experiments before)
          if (!multiVariant && allowedMergedTypes.includes(plot.data[0]?.type)) {
            plot.layout.title = '';
          }
          plot.data.push({
            colorKey: `${idToName[taskId]}-${taskId}`,
            name: idToName[taskId],
            type: plot.data[0]?.type,
            task: taskId,
            mode: plot.data[0]?.mode,
            visible: 'legendonly',
            fakePlot: true,
            x: [null],
            y: [null],
            z: plot.data[0]?.type === 'scatter3d' ? [null] : undefined
          });
        }
      });
    }
  }));
}

export function createMultiSingleValuesMultiChart(singleValues: EventsGetTaskSingleValueMetricsResponseTasks[], visibles = {}): ExtFrame[] {
  const yValues = singleValues?.map(singleValue => singleValue.values.map(trace => (trace.value))).flat(1) ?? [0];
  const maxY = maxInArray(yValues);
  const tickformat = maxY >= 1e9 || (maxY < 1e-5 && maxY > 0) ? '.1e' : undefined;
  const chartLayout = {
    title: {text: 'Summary'},
    barmode: 'group' as ExtLayout['barmode'],
    bargap: 0.08,
    bargroupgap: 0,
    xaxis: {title: {text: ''}},
    yaxis: {tickformat},
    margin: {
      l: 90,
      r: 90,
      t: 80,
      b: 114,
      pad: 0,
      autoexpand: true
    }
  };


  const groupedData = {} as Record<string, any>;
  singleValues.forEach(taskEntry => {
    const taskName = taskEntry.task_name;
    const taskId = taskEntry.task;

    taskEntry.values.forEach(valueEntry => {
      const variant = valueEntry.variant;

      const newSingleChart = {
        x: [''],
        y: [valueEntry.value],
        metric: ' Summary',
        variant: variant,
        type: 'singleValues',
        name: taskName, // This name appears in the legend
        task: taskId
      };
      if (!groupedData[variant]) {
        groupedData[variant] = [newSingleChart];
      } else {
        groupedData[variant].push(newSingleChart);
      }

    });
  });

  return Object.entries(groupedData).map(([variant, tasks], i) => prepareGraph(tasks.map(task => ({
    ...task,
    type: 'bar',
    task: task.task,
    name: task.name,
    metric: task.metric,
    visible: true
  } as ExtData)), {...chartLayout, title: {text: variant}, type: 'singleValues', showlegend: true}, {}, tasks[i] ?? tasks[0]));
}

export function createMultiSingleValuesChart(singleValues: EventsGetTaskSingleValueMetricsResponseTasks[], visibles = {}): ExtFrame {
  const yValues = singleValues?.map(singleValue => singleValue.values.map(trace => (trace.value))).flat(1) ?? [0];
  const maxY = maxInArray(yValues);
  const tickformat = maxY >= 1e9 || (maxY < 1e-5 && maxY > 0) ? '.1e' : undefined;
  const chartLayout = {title: {text: 'Summary'}, barmode: 'group' as ExtLayout['barmode'], bargap: 0.08, bargroupgap: 0, xaxis: {title: {text: 'Series'}}, yaxis: {tickformat}};
  const chartData = singleValues.map(task => ({
    type: 'bar',
    task: task.task,
    name: task.task_name,
    visible: visibles[task.task],
    x: task.values.map(v => v.variant),
    y: task.values.map(v => v.value)
  }) as ExtData);
  return prepareGraph(chartData, chartLayout, {}, {type: 'singleValue', metric: 'Summary'});
}

export const _testWhite = (x) => {
  const white = new RegExp(/^[\s\-_]$/);
  return white.test(x.charAt(0));
};

export const stripHtml = (s) => s.replace(/<[^>]*>?/gm, '');

export const timeInWords = (milliseconds: number, granularityLevel = 3) => {
  let remaining = Math.floor(milliseconds / 1000);
  if (remaining <= 0) {
    return '0';
  }
  const output = [];
  const timesConst = [12 * 30 * 24 * 60 * 60, 30 * 24 * 60 * 60, 24 * 60 * 60, 60 * 60, 60, 1];
  const timeStringPlural = ['Years', 'Months', 'Days', 'Hours', 'Minutes', 'Seconds'];
  const timeStringSingle = ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'];
  for (let i = 0; i < timesConst.length; i++) {
    const unitCount = Math.floor(remaining / timesConst[i]);
    if (unitCount === 0) {
      continue;
    }
    remaining %= timesConst[i];
    const unitString = unitCount > 1 ? `${unitCount} ${timeStringPlural[i]}` : `${unitCount} ${timeStringSingle[i]}`;
    output.push(unitString);
    if (output.length >= granularityLevel) {
      break;
    }
  }
  return output.join(' ');
};

