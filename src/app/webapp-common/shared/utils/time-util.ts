export interface HumanizedResult {
  humanizedUnit: string;
  humanizedValue: string | number;
}

export const getHumanizeNumber = (value) => {
  const absValue = Math.abs(value);

  if (absValue < 1000) {
    // For small numbers, we might still want to limit decimals if they are floats
    return {
      humanizedValue: Number(value.toFixed(3)).toString(),
      humanizedUnit: ''
    };
  }

  const suffixes = [
    { value: 1e18, symbol: 'E' },
    { value: 1e15, symbol: 'Q' },
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' }
  ];

  for (const suffix of suffixes) {
    if (absValue >= suffix.value) {
      const divided = value / suffix.value;

      // 1. toFixed(3) ensures we cap at 3 decimal places
      // 2. Number(...) + toString() naturally removes trailing zeros
      const formattedValue = Number(divided.toFixed(3)).toString();

      return {
        humanizedValue: formattedValue,
        humanizedUnit: suffix.symbol
      };
    }
  }

  return { humanizedValue: value.toString(), humanizedUnit: '' };
}

export const getHumanizedTimeUsage = (initialUnit: string, timeCount: number) => {
  const units = [
    { name: 's', factor: 1 },
    { name: 'm', factor: 60 },
    { name: 'h', factor: 3600 },
    { name: 'd', factor: 86400 }
  ];
  if(timeCount===0) {
    return { humanizedValue: 0, humanizedUnit:'' };
  }
  // 1. Normalize input to seconds
  const unitMap: Record<string, number> = { sec: 1, s: 1, min: 60, m: 60, hour: 3600, h: 3600, day: 86400, d: 86400 };
  const totalSeconds = timeCount * (unitMap[initialUnit.toLowerCase()] || 1);

  // 2. Determine the highest unit to use
  let unitIndex = 2;
  if (totalSeconds >= 86400) unitIndex = 3;      // Days
  else if (totalSeconds >= 3600) unitIndex = 2; // Hours
  else if (totalSeconds >= 60) unitIndex = 2;   // Minutes
  else unitIndex = 2;                           // Seconds
  const majorUnit = units[unitIndex];

  // 3. If it's the smallest unit (s), just return it
  if (unitIndex === 0) {
    return { humanizedValue: Math.floor(totalSeconds).toString(), humanizedUnit: 's' };
  }

  // 4. Calculate Major and Minor values
  // Example: 262800s / 86400 = 3 days
  const majorValue = Math.floor(totalSeconds / majorUnit.factor);

  // Get the remainder and divide it by the next unit down
  // Example: (262800s % 86400) = 3600s left. 3600s / 3600 = 1 hour.
  const minorUnit = units[unitIndex - 1];
  const minorValue = Math.floor((totalSeconds % majorUnit.factor) / minorUnit.factor);

  const humanizedValue = `${majorValue}:${minorValue.toString().padStart(2, '0')}`;
  const humanizedUnit = majorUnit.name;

  return { humanizedValue, humanizedUnit };
}

export const getHumanizedStorageUsage = (initialUnit: string, storageCount: number) => {
  const units = ['Byte', 'KB', 'MB', 'GB', 'TB'];
  const factor = 1024;
  if (storageCount===0) {
    return { humanizedValue: 0, humanizedUnit: '' };
  }

  const currentUnitStr = initialUnit.toLowerCase();
  // Normalize lookup: 'byte' -> 'Byte', others -> uppercase (KB, MB, etc)
  const normalizedInput = currentUnitStr === 'byte' ? 'Byte' : initialUnit.toUpperCase();
  let unitIndex = units.indexOf(normalizedInput);

  if (unitIndex === -1) {
    return { humanizedValue: storageCount.toString(), humanizedUnit: initialUnit };
  }

  let value = storageCount;

  // Scale UP (e.g., 1024 MB -> 1 GB)
  while (value >= factor && unitIndex < units.length - 1) {
    value /= factor;
    unitIndex++;
  }

  // Scale DOWN (e.g., 0.5 GB -> 512 MB)
  // We check value > 0 to avoid infinite loops with 0
  while (value < 1 && unitIndex > 0 && value > 0) {
    value *= factor;
    unitIndex--;
  }

  // Use Number.parseFloat to remove trailing zeros if desired (e.g., 512.00 -> 512)
  const humanizedValue = parseFloat(value.toFixed(2)).toString();
  const humanizedUnit = units[unitIndex];

  return { humanizedValue, humanizedUnit };
};

export const enum TIME_IN_MILLI {
  ONE_SEC = 1000,
  ONE_MIN = 60 * TIME_IN_MILLI.ONE_SEC,
  ONE_HOUR = 60 * TIME_IN_MILLI.ONE_MIN,
  ONE_DAY = 24 * TIME_IN_MILLI.ONE_HOUR,
}

export function humanizeUsage(unit: string | undefined, value: number): HumanizedResult {
  const normalizedUnit = unit?.toLowerCase() || '';
  if(value === 0){
    return { humanizedUnit:'', humanizedValue:value };
  }

  const storageUnits = ['byte', 'kb', 'mb', 'gb'];
  const timeUnits = ['sec', 'min', 'hour', 'day'];

  if (storageUnits.includes(normalizedUnit)) {
    return getHumanizedStorageUsage(normalizedUnit, value);
  }

  if (timeUnits.includes(normalizedUnit)) {
    return getHumanizedTimeUsage(normalizedUnit, value);
  }

  if (!normalizedUnit) {
    return getHumanizeNumber(value);
  }

  // Default fallback
  return {
    humanizedUnit: unit ?? '',
    humanizedValue:  `${getHumanizeNumber(value).humanizedValue}${getHumanizeNumber(value).humanizedUnit}`
  };
}

