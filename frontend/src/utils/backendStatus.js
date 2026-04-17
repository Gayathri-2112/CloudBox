import { getBackendUnavailableMessage } from "./requestErrors";

const listeners = new Set();

let state = {
  reachable: typeof navigator === "undefined" ? true : navigator.onLine,
  message:
    typeof navigator !== "undefined" && navigator.onLine === false
      ? "You appear to be offline. Check your internet connection and try again."
      : "",
};

function emit() {
  listeners.forEach((listener) => listener(state));
}

function setState(nextState) {
  state = nextState;
  emit();
}

export function getBackendStatus() {
  return state;
}

export function subscribeBackendStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markBackendAvailable() {
  if (!state.reachable || state.message) {
    setState({ reachable: true, message: "" });
  }
}

export function markBackendUnavailable(error) {
  setState({
    reachable: false,
    message: getBackendUnavailableMessage(error),
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    setState({ reachable: true, message: "" });
  });

  window.addEventListener("offline", () => {
    setState({
      reachable: false,
      message: "You appear to be offline. Check your internet connection and try again.",
    });
  });
}
