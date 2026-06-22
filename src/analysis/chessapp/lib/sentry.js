import * as Sentry from "@analysis/shims/sentry";
const env = import.meta.env;
const isSentryEnabled = () => !!(env.VITE_SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN) && Sentry.isInitialized();
const logErrorToSentry = (error, context) => {
  if (isSentryEnabled()) {
    Sentry.captureException(error, {
      extra: context
    });
  } else {
    console.error(error);
  }
};
export {
  isSentryEnabled,
  logErrorToSentry
};
