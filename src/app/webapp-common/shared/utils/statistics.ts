import {last} from 'lodash-es';
import {maxInArray} from '@common/shared/utils/helpers.util';
import {ResourceUsageSeries} from '~/business-logic/model/workers/resourceUsageSeries';

export interface DataPoint {
  date: string;
  originalDate?: number;
  value: number;
}

export interface Topic {
  topicName: string;
  topicID?: string;
  topic: number;
  dates: DataPoint[];
}

export interface RequestParam {
  key: string;
  aggregation?: string;
}

const defaultMaxValHandler = {
  get: function (target: object, name: string) {
    if (!Object.hasOwn(target,name)) {
      target[name] = maxInArray([...Object.values(target) as number[], 0]) + 1;
    }
    return target[name];
  }
};

export function addStats(current: Topic[], data, maxPoints: number,
  requestedKeys: RequestParam[],
  entityParamName: string,
  paramInfo: {
    [key: string]: {
      title: string;
      multiply: number;
      suffix?: string;
    };
  }) {
  const topicIDs = new Proxy({}, defaultMaxValHandler);
  let dataByTopic: Topic[];
  if (current) {
    current.forEach(topicObj => topicIDs[topicObj.topicID] = topicObj.topic);
    dataByTopic = current.slice();
  } else {
    dataByTopic = [];
  }

  const shouldAddEntity = data.length > 1;
  data.forEach(entityData => {
    const entity = entityData[entityParamName];
    requestedKeys.forEach(reqKey => {
      const paramData = entityData.metrics.find(metric => metric.metric === reqKey.key);
      if (!paramData) {
        return;
      }
      const param = paramData.metric;
      const stats = paramData.stats.reduce((acc, obj) => {
        acc.push({...obj}); // Push the main object
        if (Array.isArray(obj.resource_series)) {
          acc.push(...obj.resource_series.map(item => ({ ...item, aggregation: item.name, isSingleResource: true, dates: obj.dates }))); // Push nested objects
        }
        return acc;
      }, []);
      let dates: number[] = paramData.dates;
      stats.forEach(aggData => {
        if (aggData.dates){
          dates= aggData.dates;
        }
        const aggregation = aggData.aggregation ? ` (${aggData.aggregation})` : '';
        const topicID     = `${entity} ${param}${aggregation}`;
        const topicName   = aggData.isSingleResource?
          `${paramInfo[param].title}${aggregation} ${paramInfo[param].suffix}`:
          `${paramInfo[param].title} ${paramInfo[param].suffix ?? ''}${aggregation}`
          + `${shouldAddEntity && entity ? ' for ' + entity : ''}`;
        let topic: Topic = dataByTopic.find(topic => topic.topicID === topicID);
        if (!topic) {
          topic = {topicName, topicID, topic: topicIDs[topicID], dates: [] as DataPoint[]};
          dataByTopic.push(topic);
        }
        const tplList = dates
          .filter(date => {
            if (topic.dates.length === 0) {
              return true;
            }
            const strDate: string = new Date(date as number).toISOString();
            return topic.dates.findIndex(dateObj => dateObj.date === strDate) < 0;
          })
          .map(date => {
            const idx = dates.indexOf(date);
            return {
              date : new Date(date as number).toISOString(),
              value: idx > -1 ? aggData.values[idx] * paramInfo[param].multiply : null
            };
          });
        topic.dates.push(...tplList);
        topic.dates = topic.dates.slice(Math.max(topic.dates.length - maxPoints, 0));
      });
    });
    // add missing keys
    requestedKeys.forEach(reqParam => {
      const item = dataByTopic.find((topic: Topic) => topic.topicID.indexOf(reqParam.key) > -1);
      if (!item) {
        const topicID   = `${entity} ${reqParam.key} avg`;
        const topicName = `${paramInfo[reqParam.key].title} ${paramInfo[reqParam.key].suffix ?? ''} (avg) ${shouldAddEntity && entity ? 'for ' + entity : ''}`;
        const topic     = {topicName: topicName, topicID: topicID, topic: topicIDs[topicID], dates: [] as DataPoint[]};
        dataByTopic.push(topic);
      }
    });
  });
  return dataByTopic;
}

export function getLastTimestamp(data: Topic[]): number {
  let lastDate = 0;
  data.forEach(topic => {
    const dates = topic.dates;
    if (dates) {
      const topicLastDate = last(dates)?.date ?? 0;
      const date          = Math.floor((new Date(topicLastDate)).getTime() / 1000);
      lastDate            = Math.max(lastDate, date);
    }
  });
  return lastDate;
}

export function removeFullRangeMarkers(topics: Topic[]) {
  const dates = topics[0].dates;
  if (dates.slice(-1)[0].value === null) {
    dates.splice(-1, 1);
  }
  if (dates[0].value === null) {
    dates.splice(0, 1);
  }
}

export function addFullRangeMarkers(topics: Topic[], fromDate: number, toDate: number) {
  topics[0].dates.splice(0, 0, {date: (new Date(fromDate * 1000)).toISOString(), value: null});
  topics[0].dates.push({date: (new Date(toDate * 1000)).toISOString(), value: null});
}

export function activitySeriesToTopic(data: ResourceUsageSeries, topicIndex: number, forceTitle?: string) {
  if (!data) {
    return null;
  }
  return {
    topic: topicIndex,
    topicName: forceTitle ?? data.title,
    topicID: forceTitle ?? data.title,
    dates: data.dates?.map((date, i) => ({
      originalDate: date,
      date: new Date(date).toISOString(),
      value: data.values[i],
    })) ?? []
  } as Topic;
}
