export function isBackendUnavailableError(error) {
  const status = error?.response?.status;

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  if (error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED") {
    return true;
  }

  if (!error?.response && !!error?.request) {
    return true;
  }

  return typeof status === "number" && status >= 500;
}

export function getBackendUnavailableMessage(error) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Check your internet connection and try again.";
  }

  if (error?.code === "ECONNABORTED") {
    return "The CloudBox backend is taking too long to respond. Please try again shortly.";
  }

  if (error?.response?.status >= 500) {
    return "The CloudBox backend is unavailable right now. Please try again in a moment.";
  }

  return "Cannot connect to the CloudBox backend. Make sure the backend server is running.";
}

export function getRequestErrorMessage(error, fallback = "Request failed") {
  if (isBackendUnavailableError(error)) {
    return getBackendUnavailableMessage(error);
  }

  if (typeof error?.response?.data === "string" && error.response.data.trim()) {
    return error.response.data;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
