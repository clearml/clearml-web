// TODO: (nir) need refactor to final validation solution
export function validateName(name: string) {
  if (name.trim().length < 3) {
    return false;
  }
  return true;
}

export function validateNotEmptyArray(arr: Array<any>) {
  if (arr && arr.length > 0) {
    return true;
  }
  return false;
}

export function validateProject(projectId: string) {
  if (projectId && projectId !== '*') {
    return true;
  } else {
    return false;
  }
}



export function areErrors(errors) {
  return Object.values(errors).find((property: any) => !property.valid);
}


export function validateJson(obj) {
  try {
    JSON.parse(obj);
  } catch (e) {
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
