let initialized = false;

export function init() {
  initialized = true;
}

export function isInitialized() {
  return initialized;
}

export function captureException() {
  // no-op shim for React-only build
}
