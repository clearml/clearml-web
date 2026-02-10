import {zip} from 'lodash-es';
import {DonutChartData} from '@common/shared/components/charts/donut/donut.component';
import {Topic} from '@common/shared/components/charts/line-chart/line-chart.component';
import {Workloads} from '~/business-logic/model/organization/workloads';

export const getStatsData = (usages: Workloads, weighted: boolean, localRuns = false) => {
  return usages?.series?.map((series, index) => ({
    topic: index,
    topicName: series.name === null ?
      localRuns === true ? 'Local Runs' : 'Unknown' :
      `${series.name}${weighted && series.gpu_usage_artifical_weights ? '*' : ''}`,
    topicID: series.id,
    dates: zip(series.dates, weighted ? series.gpu_usage : series.duration)
      .map(([date, value]) => ({
        value: value / 3600,
        date: new Date(date * 1000).toISOString(),
        originalDate: date
      }))
  } as Topic)) ?? [];
}

export const getTotalsData = (usages: Workloads, weighted: boolean, localRuns = false) => {
  const sum = usages?.total?.reduce((sum, queue) => sum + queue.gpu_usage, 0) ?? 0;
  return  usages?.total?.map((series, index) => ({
    name: series.name === null ?
      localRuns === true ? 'Local Runs' : 'Unknown' :
      `${series.name}${weighted && series.gpu_artificial_weights ? '*' : ''}`,
    id: index,
    quantity: +((weighted ? series.gpu_usage : series.duration) / 3600).toFixed(3),
    percentage: sum === 0 ? 0 : +(weighted ? series.gpu_usage : series.duration / sum * 100).toFixed(3),
  } as DonutChartData)) ?? []
}
