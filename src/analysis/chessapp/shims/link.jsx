import React from 'react';

function toHrefString(href) {
  if (typeof href === 'string') return href;
  if (!href || typeof href !== 'object') return '#';

  const pathname = href.pathname || window.location.pathname;
  const query = href.query || {};
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

const Link = React.forwardRef(function Link({ href, onClick, children, ...rest }, ref) {
  const resolvedHref = toHrefString(href);

  return (
    <a ref={ref} href={resolvedHref} onClick={onClick} {...rest}>
      {children}
    </a>
  );
});

export default Link;
