// src/utils/url.ts
// Safely join URL parts without duplicate or triple slashes
export function joinUrl(...parts: string[]): string {
  const cleanParts = parts
    .filter((p) => p != null && String(p).length > 0)
    .map((p) => String(p));

  if (cleanParts.length === 0) return '';

  // Start with the first part as-is except trimming trailing slashes
  let result = cleanParts[0].replace(/\/+$/g, '');

  for (let i = 1; i < cleanParts.length; i++) {
    const segment = cleanParts[i].replace(/^\/+/, '').replace(/\/+$/g, '');
    if (segment.length === 0) continue;
    result += '/' + segment;
  }

  return result;
}

// Ensure trailing slash control is explicit when needed
export function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : url + '/';
}
