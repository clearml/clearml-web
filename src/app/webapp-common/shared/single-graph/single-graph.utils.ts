import {interpolateBasis} from 'd3-interpolate';

export const generate1DKernel = (sigma: number, kernelSize: number): number[] => {
  // Ensure kernel size is odd
  if (kernelSize % 2 === 0) {
    throw new Error('Kernel size must be an odd number');
  }

  const kernel: number[] = [];
  const center = Math.floor(kernelSize / 2);
  let sum = 0;

  // Calculate Gaussian kernel weights
  for (let x = 0; x < kernelSize; x++) {
    const distance = x - center;
    const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
    kernel.push(weight);
    sum += weight;
  }
  // Normalize the kernel
  return kernel.map(value => value / sum);
}
export const smooth1D = (data: number[], sigma: number, kernelSize: number): number[] => {
  const kernel = generate1DKernel(sigma, kernelSize);
  const smoothed: number[] = new Array(data.length).fill(0);
  const halfKernel = Math.floor(kernelSize / 2);

  for (let i = 0; i < data.length; i++) {
    let smoothedValue = 0;
    for (let j = 0; j < kernelSize; j++) {
      const index = i + j - halfKernel;
      // Handle edge cases with boundary reflection
      const safeIndex = Math.max(0, Math.min(data.length - 1, index));
      smoothedValue += data[safeIndex] * kernel[j];
    }
    smoothed[i] = smoothedValue;
  }
  return smoothed;
}


export type SmoothTypeEnum = 'runningAverage' | 'exponential' | 'gaussian' | 'any';
export const smoothTypeEnum = {
  exponential: 'Exp. Moving Average' as SmoothTypeEnum,
  runningAverage: 'Running Average' as SmoothTypeEnum,
  gaussian: 'Gaussian' as SmoothTypeEnum,
  any: 'No Smoothing' as SmoothTypeEnum
};

export const generateColorKey = (name: string, task: string, colorKey: string, isCompare)=> {
  const variant = colorKey || name;
  if (!isCompare) {
    // "?" to adjust desired colors (legend title is removing this ?)
    // trim() because in hiDpi we add spaces to name
    return `${variant?.trim()}?`;
  } else {
    return variant?.endsWith(task) ? variant : `${variant}-${task}`;
  }
}

export const averageDebiased = (arr, weight) => {
  let last = arr?.length ? 0 : NaN;
  let validPoints = 0;
  return arr.map((d, i) => {
    if (!isFinite(last)) {
      return null;
    } else {
      // 1st-order IIR low-pass filter to attenuate the higher-frequency
      // components of the time-series, with bias fix toward initial value.
      last = last * weight + (1 - weight) * d;
      validPoints++;
      if (i === 0) {
        return d;
      }
      const debiasWeight = (i > 0 && weight < 1) ? 1 - Math.pow(weight, validPoints) : 1;
      return last / debiasWeight;
    }
  });
};


function movingAverageSmooth(data: number[], windowSize: number): number[] {
  if (!data || data.length === 0) {
    return [];
  }

  const smoothedData: number[] = [];
  for (let i = 0; i < data.length; i++) {
    let currentWindow: number[];
    if (i < windowSize - 1) {
      currentWindow = data.slice(0, i + 1);
    } else {
      currentWindow = data.slice(i - windowSize + 1, i + 1);
    }

    const smoothedValue = currentWindow.reduce((sum, value) => sum + value, 0) / currentWindow.length;
    smoothedData.push(smoothedValue);
  }

  return smoothedData;
}



export const getSmoothedLine = (arr, weight=1, smoothType, sigma =2): number[] => {
  switch (smoothType) {
    case smoothTypeEnum.runningAverage:
      return arr.length > 5 ? movingAverageSmooth(arr, weight) : arr;
    case smoothTypeEnum.gaussian:
      return arr.length > 5 ? smooth1D(arr, sigma, weight): arr;
    case smoothTypeEnum.exponential:
      return averageDebiased(arr, weight);
  }
  return arr;
};

export const interpolateY = (y): { x: number[], y: number[] } => {
  const interpolator = interpolateBasis(y);
  const newX = Array.from({length: 20}, (_, i) => (i / 2));  // 0 to 10, step 0.5
  const interpolatedY = newX.map((_, i, arr) => interpolator(i / arr.length));
  return {x: newX, y: interpolatedY};
};

