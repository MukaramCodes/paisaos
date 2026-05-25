/** Deterministically converts a user key into a UUID for cloud sync. */
export async function keyToUserId(key: string): Promise<string> {
  const data = new TextEncoder().encode('paisaos-v1:' + key.trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const b = new Uint8Array(hash);
  const h = Array.from(b.slice(0, 16)).map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
}
