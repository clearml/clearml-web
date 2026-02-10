import {createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import {
  getGraphDisplayFullDetailsScalars, mergeGraphDisplayFullDetailsScalars, setCurrentPlot, setGraphDisplayFullDetailsScalars, setGraphDisplayFullDetailsScalarsIsOpen, setPlotIterations,
  setPlotViewerScrollId,
  setViewerBeginningOfTime,
  setViewerEndOfTime,
  setXtypeGraphDisplayFullDetailsScalars
} from '@common/shared/single-graph/single-graph.actions';
import {ExtFrame} from '@common/shared/single-graph/plotly-graph-base';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';


export const FeatureKey = '';

export interface SingleGraphState {
  fullScreenDetailedChart: ExtFrame;
  fetchingFullScreenData: boolean;
  fullScreenXtype: ScalarKeyEnum;
  isFullScreenOpen: boolean;
  minMaxIterations: { minIteration: number; maxIteration: number };
  currentPlotViewer: any;
  plotViewerScrollId: string;
  plotViewerEndOfTime: boolean;
  plotViewerBeginningOfTime: boolean;
}

export const initialState: SingleGraphState = {
  fullScreenDetailedChart: null,
  isFullScreenOpen: false,
  fullScreenXtype: null,
  fetchingFullScreenData: false,
  currentPlotViewer: null,
  minMaxIterations: null,
  plotViewerScrollId: null,
  plotViewerEndOfTime: null,
  plotViewerBeginningOfTime: null,
};

export const singleGraphReducer = createReducer(
  initialState,
  on(setGraphDisplayFullDetailsScalars, (state, action): SingleGraphState => ({...state, fullScreenDetailedChart: action.data})),
  on(setGraphDisplayFullDetailsScalarsIsOpen, (state, action): SingleGraphState => ({
    ...state,
    isFullScreenOpen: action.isOpen,
    fullScreenDetailedChart: null,
    currentPlotViewer: null,
    plotViewerScrollId: null,
    minMaxIterations: null
  })),
  on(getGraphDisplayFullDetailsScalars, (state): SingleGraphState => ({...state, fetchingFullScreenData: true})),
  on(setXtypeGraphDisplayFullDetailsScalars, (state, action): SingleGraphState => ({...state, fullScreenXtype: action.xAxisType})),
  on(mergeGraphDisplayFullDetailsScalars, (state, action): SingleGraphState => ({
    ...state,
    fullScreenDetailedChart: {...state.fullScreenDetailedChart, data: action.data},
    fetchingFullScreenData: false
  })),
  on(setPlotViewerScrollId, (state, action): SingleGraphState => ({...state, plotViewerScrollId: action.scrollId})),
  on(setViewerEndOfTime, (state, action): SingleGraphState => ({...state, plotViewerEndOfTime: action.endOfTime})),
  on(setViewerBeginningOfTime, (state, action): SingleGraphState => ({...state, plotViewerBeginningOfTime: action.beginningOfTime})),
  on(setCurrentPlot, (state, action): SingleGraphState => ({...state, currentPlotViewer: action.event})),
  on(setPlotIterations, (state, action): SingleGraphState => ({...state, minMaxIterations: {minIteration: action.min_iteration, maxIteration: action.max_iteration}})),
);

const selectSingleGraph = createFeatureSelector<SingleGraphState>('singleGraph');

export const selectMinMaxIterations = createSelector(selectSingleGraph, (state) => state.minMaxIterations);
export const selectCurrentPlotViewer = createSelector(selectSingleGraph, (state) => state.currentPlotViewer);
export const selectPlotViewerScrollId = createSelector(selectSingleGraph, (state) => state.plotViewerScrollId);
export const selectViewerEndOfTime = createSelector(selectSingleGraph, (state) => state.plotViewerEndOfTime);
export const selectViewerBeginningOfTime = createSelector(selectSingleGraph, (state) => state.plotViewerBeginningOfTime);
export const selectFullScreenChartXtype = createSelector(selectSingleGraph, (state): ScalarKeyEnum => state.fullScreenXtype);
export const selectFullScreenChartIsOpen = createSelector(selectSingleGraph, (state): boolean => state.isFullScreenOpen);
export const selectFullScreenChartIsFetching = createSelector(selectSingleGraph, (state): boolean => state.fetchingFullScreenData);
export const selectFullScreenChart = createSelector(selectFullScreenChartXtype, selectFullScreenChartIsFetching, selectSingleGraph, (axisType, isFetching, state) => {
    if (axisType === ScalarKeyEnum.IsoTime && state.fullScreenDetailedChart) {
      return {
        ...state.fullScreenDetailedChart,
        data: state.fullScreenDetailedChart.data.reduce((graphAcc, graph) => {
          graphAcc.push({...graph, x: graph.x.map(ts => new Date(ts) as any)});
          return graphAcc;
        }, [])
      };
    }
    return state.fullScreenDetailedChart;
  }
);
