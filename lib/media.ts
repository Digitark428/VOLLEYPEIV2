export function protectedMediaUrl(value: string | null | undefined) {
  if (!value) return null;
  let path = value;
  try {
    const url = new URL(value);
    const markers = ['/storage/v1/object/public/', '/storage/v1/object/sign/'];
    const marker = markers.find((item) => url.pathname.includes(item));
    if (!marker) return value;
    const storagePath = decodeURIComponent(url.pathname.split(marker)[1] ?? '');
    const [bucket, ...parts] = storagePath.split('/');
    if (!['media-public', 'posters', 'sponsors'].includes(bucket)) return value;
    path = bucket === 'media-public' ? parts.join('/') : [bucket, ...parts].join('/');
  } catch {
    path = value;
  }
  const safePath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return safePath ? `/media/${safePath}` : null;
}
