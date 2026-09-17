/**
 * Random hex string. `crypto.getRandomValues` is unavailable in some non-secure
 * (plain HTTP) or embedded contexts, where the token is only a client-side draft
 * grouping key, so a Math.random fallback is acceptable.
 */
export function randomHex(byteLength: number): string {
  const values = new Uint8Array(byteLength);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i++) {
      values[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(values, (value) =>
    value.toString(16).padStart(2, '0')
  ).join('');
}
