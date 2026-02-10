export function validateJson(obj) {
  try {
    JSON.parse(obj);
  } catch {
    return false;
  }
  return true;
}

export const safeJsonParse = (str, defaultValue = {}) => {
  try {
    const parsed = JSON.parse(str);
    // Ensure the result is an object, as we intend to spread it.
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return defaultValue;
  } catch (e) {
    // If parsing fails, return the default value.
    return defaultValue;
  }
}

export const NotOnlyWhiteSpacePattern =  /^(?!\s*$).+/;

export const integerPattern = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;
