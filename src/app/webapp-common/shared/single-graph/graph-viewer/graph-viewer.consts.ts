import {ChartPreferences, ExtFrame, ExtLegend} from '@common/shared/single-graph/plotly-graph-base';
import {SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';

export interface GraphViewerData {
  chart: ExtFrame;
  id: string;
  xAxisType?: 'iter' | 'timestamp' | 'iso_time';
  chartSettings?: ChartPreferences;
  smoothWeight?: number;
  smoothType?: SmoothTypeEnum;
  hideNavigation: boolean;
  isCompare: boolean;
  moveLegendToTitle: boolean;
  showOrigin: boolean;
  embedFunction: (data: { xaxis: ScalarKeyEnum; domRect: DOMRect }) => void;
  legendConfiguration: Partial<ExtLegend>;
  darkTheme?: boolean;
  dialogTitle?: string;
}
