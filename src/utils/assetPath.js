const ABSOLUTE_OR_DATA = /^(?:[a-z]+:)?\/\//i;

const getBaseUrl = () => {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
};

export const toPublicPath = (value) => {
  if (value == null || value === '') return value;
  const input = String(value);
  if (ABSOLUTE_OR_DATA.test(input) || input.startsWith('data:')) return input;

  const base = getBaseUrl();
  const trimmed = input.startsWith('/') ? input.slice(1) : input;
  return `${base}${trimmed}`;
};

export const toAssetPath = (value) => {
  if (value == null || value === '') return value;
  const input = String(value);
  if (ABSOLUTE_OR_DATA.test(input) || input.startsWith('data:')) return input;

  if (input.startsWith('/assets/')) {
    return toPublicPath(input);
  }

  if (input.startsWith('assets/')) {
    return toPublicPath(input);
  }

  return toPublicPath(`assets/${input.replace(/^\/+/, '')}`);
};
