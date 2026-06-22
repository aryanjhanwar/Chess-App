export function toPublicPath(path = "") {
  if (typeof path !== "string" || path.length === 0) {
    return path;
  }

  if (/^(?:[a-z]+:)?\/\//i.test(path)) {
    return path;
  }

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}
