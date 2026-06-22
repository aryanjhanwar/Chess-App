import { useEffect, useMemo, useState } from 'react';

function parseQuery(search) {
  const params = new URLSearchParams(search);
  const query = {};
  for (const [key, value] of params.entries()) {
    query[key] = value;
  }
  return query;
}

function buildUrl(href) {
  if (typeof href === 'string') {
    return href;
  }

  const pathname = href?.pathname || window.location.pathname;
  const query = href?.query || {};
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function notifyRouterUpdate() {
  window.dispatchEvent(new Event('router:update'));
}

export function useRouter() {
  const [locationState, setLocationState] = useState(() => ({
    pathname: window.location.pathname,
    query: parseQuery(window.location.search),
  }));

  useEffect(() => {
    const sync = () => {
      setLocationState({
        pathname: window.location.pathname,
        query: parseQuery(window.location.search),
      });
    };

    window.addEventListener('popstate', sync);
    window.addEventListener('router:update', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('router:update', sync);
    };
  }, []);

  return useMemo(
    () => ({
      pathname: locationState.pathname,
      query: locationState.query,
      async push(href) {
        const url = buildUrl(href);
        window.history.pushState({}, '', url);
        notifyRouterUpdate();
        return true;
      },
      async replace(href) {
        const url = buildUrl(href);
        window.history.replaceState({}, '', url);
        notifyRouterUpdate();
        return true;
      },
    }),
    [locationState]
  );
}
