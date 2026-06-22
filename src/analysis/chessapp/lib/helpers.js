const getPaddedNumber = (month) => {
  return month < 10 ? `0${month}` : month;
};
const capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export {
  capitalize,
  getPaddedNumber,
  isInViewport,
  sleep
};
