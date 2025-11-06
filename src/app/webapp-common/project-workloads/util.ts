import {Usages} from '~/business-logic/model/organization/usages';
import {Topic} from '@common/shared/utils/statistics';
import {zip} from 'lodash-es';
import {DonutChartData} from '@common/shared/components/charts/donut/donut.component';

export const getStatsData = (usages: Usages, weighted: boolean, localRuns = false) => {
  return usages?.series.map((series, index) => ({
    topic: index,
    topicName: series.name === null ?
      localRuns === true ? 'Local Runs' : 'Unknown' :
      `${series.name}${weighted && series.gpu_artificial_weights ? '*' : ''}`,
    topicID: series.id,
    dates: zip(series.dates, weighted ? series.gpu_usage : series.duration)
      .map(([date, value]) => ({
        value: value / 3600,
        date: new Date(date * 1000).toISOString(),
        originalDate: date
      }))
  } as Topic)) ?? [];
}

export const getTotalsData = (usages: Usages, weighted: boolean, localRuns = false) => {
  const sum = usages?.total.reduce((sum, queue) => sum + queue.gpu_usage, 0) ?? 0;
  return  usages?.total.map((series, index) => ({
    name: series.name === null ?
      localRuns === true ? 'Local Runs' : 'Unknown' :
      `${series.name}${weighted && series.gpu_artificial_weights ? '*' : ''}`,
    id: index,
    quantity: +((weighted ? series.gpu_usage : series.duration) / 3600).toFixed(3),
    percentage: sum === 0 ? 0 : +(weighted ? series.gpu_usage : series.duration / sum * 100).toFixed(3),
  } as DonutChartData)) ?? []
}
