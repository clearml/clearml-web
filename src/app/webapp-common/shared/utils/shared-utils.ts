import {MEDIA_VIDEO_EXTENSIONS, MediaContentTypeEnum} from '~/app.constants';
import {ActivatedRoute} from '@angular/router';
import {EXPERIMENT_GRAPH_ID_PREFIX} from '../../experiments/shared/common-experiments.const';
import {capitalize, escape, get, last, snakeCase} from 'lodash-es';
import {User} from '~/business-logic/model/users/user';
import {TABLE_SORT_ORDER} from '../ui-components/data/table/table.consts';
import {camelCase} from 'lodash-es';


const CRC_TABLE = () => {
  const polynomial = 0x04C11DB7;
  const table = new Array(256);

  const reverse = (x, n) => {  // TODO
    let b = 0;
    while (--n >= 0) {
      b <<= 1;
      b |= x & 1;
      x >>>= 1;
    }
    return b;
  };

  let i = -1;
  while (++i < 256) {
    let g = reverse(i, 32);
    let j = -1;
    while (++j < 8) {
      g = ((g << 1) ^ (((g >>> 31) & 1) * polynomial)) >>> 0;
    }
    table[i] = reverse(g, 32);
  }
  return table;
};

export const isVideo = (contentType: MediaContentTypeEnum, uri: string) => {

  if (contentType) {
    return (contentType.indexOf('video') > -1);
  } else {
    try {
      const url = new URL(uri);
      const extension = url.pathname.split('.').pop();
      return MEDIA_VIDEO_EXTENSIONS.includes(extension);
    } catch {
      return false;
    }
  }
};

export const isSourceVideo = (source) => {

  const contentType = (source.preview && source.preview.content_type) ? source.preview.content_type : source.content_type;
  const uri = (source.preview && source.preview.uri) ? source.preview.uri : source.uri;
  if (source.dprs) {
    return false;
  }
  return isVideo(contentType, uri);
};

export const isMarkDown = (url: string) => url.endsWith('.md');
export const isHtmlOrText = (url: string) => {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const ext = last(parsed.pathname.split('.'));
    return ['txt', 'text', 'html', 'htm', 'md'].includes(ext);
  } catch {
    return false;
  }
};

export const createModelLink = (uri, modelId, modelSignedUri) => {
  const uriArray = uri.split('/');
  const filename = uriArray[uriArray.length - 1];
  const url = '/static/network?obj={"path":"' + modelSignedUri + '","fileName":"' + filename + '","id":"' + modelId + '"}';
  return encodeURI(url);
};

export const allItemsAreSelected = (itemsInView: { id: string }[], selectedItems: { id: string }[]) => {
  if (!itemsInView?.length || !selectedItems?.length) {
    return false;
  } else {
    const selectedItemsIds = selectedItems?.map(item => item.id);
    return (itemsInView?.every(item => selectedItemsIds.includes(item.id)));
  }
};

export const addOrRemoveFromArray = <T>(arr: T[] = [], item: T) => {
  if (arr.includes(item)) {
    return arr.filter(arrItem => item !== arrItem);
  } else {
    return arr.concat([item]);
  }
};

export const scrollToElement = id => {
  const element = document.getElementById(EXPERIMENT_GRAPH_ID_PREFIX + id);
  if (!element) {
    if (id) {
      console.warn('Can not find metric element: ', id);
    }
    return;
  }
  element.scrollIntoView({block: 'start', behavior: 'smooth'});
};

export const isScrolledIntoView = el => {
  const rect = el.getBoundingClientRect();
  const elemTop = rect.top;
  const elemBottom = rect.bottom;

  // Only completely visible elements return true:
  // const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
  // Partially visible elements return true:
  return elemTop < window.innerHeight && elemBottom >= 0;
};

export const getRouteFullUrl = (route: ActivatedRoute) => {
  let path = route.routeConfig.path;
  while (route.firstChild) {
    route = route.firstChild;
    path += '/' + route.snapshot.url.map(a => a.path).join('/');
  }
  return path;
};

export const removeAlphaColor = (rgbaColor: string) => {
  const rgbaColorArr = rgbaColor.substring(rgbaColor.indexOf('(') + 1, rgbaColor.indexOf(')')).split(',');
  return `rgb(${rgbaColorArr[0]},${rgbaColorArr[1]},${rgbaColorArr[2]})`;
};

export const addAlphaColor = (rgbaColor: string, alpha: string) => {
  const rgbaColorArr = rgbaColor.substring(rgbaColor.indexOf('(') + 1, rgbaColor.indexOf(')')).split(',');
  return `rgb(${rgbaColorArr[0]},${rgbaColorArr[1]},${rgbaColorArr[2]}, ${alpha})`;
};

export const isExample = item => item?.company && !item.company?.id;

export const isAnnotationTask = entity => entity.system_tags && entity.system_tags.includes('Annotation');

export const getCssTheme = (el: HTMLElement): string => {
  do {
    if (el.classList.contains('dark-theme')) {
      return 'dark-theme';
    }
    if (el.classList.contains('light-theme')) {
      return 'light-theme';
    }
    el = ((el.parentElement || el.parentNode) as HTMLElement);
  } while (el !== null && el.nodeType === 1);
  return null;
};

export function crc32(str, ...rest /* , polynomial = 0x04C11DB7, initialValue = 0xFFFFFFFF, finalXORValue = 0xFFFFFFFF*/) {
  const s = String(str);
  const table = CRC_TABLE;
  const initialValue = arguments.length < 3 ? 0xFFFFFFFF : (rest[1] >>> 0);
  const finalXORValue = arguments.length < 4 ? 0xFFFFFFFF : (rest[2] >>> 0);
  let crc = initialValue;
  const length = s.length;
  let k = -1;
  while (++k < length) {
    const c = s.charCodeAt(k) % 255; // Modulus 255 not part of crc32, used to support non-english text. YK
    if (c > 255) {
      throw new RangeError();
    }
    const index = (crc & 255) ^ c;
    crc = ((crc >>> 8) ^ table[index]) >>> 0;
  }
  return (crc ^ finalXORValue) >>> 0;
}

export const htmlTextShort = (name: string, limit = 80) => {
  if (name?.length > limit) {
    return `<span title="${name}">${escape(name.slice(0, limit - 3))}...</span>`;
  }
  return escape(name);
};

export const findRegexRecursively = (object, field: string, regex: RegExp) => {
  const currentValue = get(object, field);
  if (currentValue) {
    return regex.test(currentValue);
  }
  const nodes = field.split('.');
  const node = nodes.shift();
  const nodeValue = object[node];
  if (!nodeValue) {
    return false;
  }
  if (typeof nodeValue == 'string' || typeof nodeValue == 'number') {
    return (nodes.length == 0 && typeof nodeValue == 'string') ? nodeValue.match(regex) : false;
  }
  for (const value of nodeValue) {
    const result = findRegexRecursively(value, nodes.join('.'), regex);
    if (result || result === null) {
      return result;
    }
  }
  return false;
};

export const groupHyperParams = (hyperParams: any[]) => hyperParams.reduce((acc, {section, name, value}) => {
  acc[section] = acc[section] || {};
  acc[section][name] = acc[section][name] || {};
  acc[section][name] = value;
  return acc;
}, {});

export const getScaleFactor = (isMobile = false) => {
  const isMac = (navigator.platform.indexOf('Mac') !== -1 || navigator.platform.indexOf('iPad') !== -1);
  const isWin = navigator.platform.indexOf('Win') !== -1;
  let dimensionRatio = 100;
  let screenHeight: number;

  if (isMobile) {
    return dimensionRatio;
  }

  try {
    if ((isWin || isMac) && (window['chrome'] || window['safari'])) {
      screenHeight = window.screen.height < window.screen.width ? window.screen.height : window.screen.width;
      dimensionRatio = Math.max(60, Math.min(100, Math.round((100 * (screenHeight / 1080) / 10)) * 10));
    }
  } catch {
    dimensionRatio = 100;
  }
  dimensionRatio = 10000 / dimensionRatio;
  return dimensionRatio;
};

export const cleanUserData = (user: User): User => user && Object.entries(user).reduce((curr, [key, value]) => {
  if (!(value === 'Unknown' || value === '')) {
    curr[key] = value;
  }
  return curr;
}, {});

export const addMultipleSortColumns = (oldOrders, colId, isShift) => {
  let orders;
  const currentSortField = oldOrders.find(field => field.field === colId);
  const newField = {
    field: colId,
    order: currentSortField?.order ? (currentSortField.order * -1) : TABLE_SORT_ORDER.DESC
  };

  if (isShift) {
    if (currentSortField) {
      orders = oldOrders.map(field => field.field === colId ? newField : field);
    } else {
      orders = [...oldOrders, newField];
    }
  } else {
    orders = [newField];
  }
  return orders;
};

export const getBaseName = (url: string): string => {
  try {
    const u = new URL(url);
    return u.pathname.split('/').at(-1);
  } catch {
    return url?.split('/').at(-1) || null;
  }
};

export const splitLine = (line: string, search: string) => {
  const regex = new RegExp(search, 'gi');
  const match = line.match(regex);
  return line.split(regex).map((part, i) => [part, match?.[i]]);
};
export const cloneItemIntoDummy = (eCell: HTMLElement, eDummyContainer: HTMLElement) => {
  // shamelessly copied from ag-grid
  // make a deep clone of the cell
  const eCellClone: HTMLElement = eCell.cloneNode(true) as HTMLElement;
  // the original has a fixed width, we remove this to allow the natural width based on content
  eCellClone.style.width = '';
  // the original has position = absolute, we need to remove this, so it's positioned normally
  eCellClone.style.position = 'static';
  eCellClone.style.left = '';
  // we put the cell into a containing div, as otherwise the cells would just line up
  // on the same line, standard flow layout, by putting them into divs, they are laid
  // out one per line
  const eCloneParent = document.createElement('div');

  // table-row, so that each cell is on a row.
  eCloneParent.style.display = 'table-row';
  eCloneParent.appendChild(eCellClone);
  eDummyContainer.appendChild(eCloneParent);
};

export const convertSnakeToCamel = (obj) => {
  return Object.keys(obj).reduce((result, key) => ({
    ...result,
    [camelCase(key)]: typeof obj[key] === 'object' && obj[key] !== null ?
      Array.isArray(obj[key]) ?
        obj[key].map(val => convertSnakeToCamel(val)) :
        convertSnakeToCamel(obj[key]) :
      obj[key],
  }), {});
};

export const convertCamelToSnake = (obj) => {
  return Object.keys(obj).reduce(
    (result, key) => ({
      ...result,
      [snakeCase(key)]: obj[key],
    }),
    {},
  );
};

export const snakeToTitle = (value: string) => value.split('_').map(w => capitalize(w)).join(' ');

export const getLowestFraction = (x0: number) => {
  const eps = 1.0E-15;
  let x = x0;
  let a = Math.floor(x);
  let h1 = 1;
  let k1 = 0;
  let h = a;
  let k = 1;

  while (x-a > eps*k*k) {
    x = 1/(x-a);
    a = Math.floor(x);
    const h2 = h1;
    h1 = h;
    const k2 = k1;
    k1 = k;
    h = h2 + a*h1;
    k = k2 + a*k1;
  }

  return [h, k];
}

export const orderJson = (data: unknown) => {
  if (data !== null && typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(val => orderJson(val));
    }
    return Object.keys(data).sort().reduce((acc, key) => {
      acc[key] = orderJson(data[key]);
      return acc;
    }, {});
  }
  return data;
}
