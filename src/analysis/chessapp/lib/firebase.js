// Mocked Firebase to save 500KB from bundle size
export const logAnalyticsEvent = (eventName, params) => {
  if (import.meta.env.DEV) {
    console.debug('[Analytics Mock]', eventName, params);
  }
};
