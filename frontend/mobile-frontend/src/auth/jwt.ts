const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// React Native / Hermes has no built-in atob, so JWT payloads are base64url-decoded by hand
// instead of relying on a browser global that may not exist on device.
/* eslint-disable no-bitwise -- bit-packing is inherent to base64 decoding, not a bug */
function base64Decode(input: string): string {
  const str = input.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of str) {
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}
/* eslint-enable no-bitwise */

export interface UserInfoClaim {
  name: string;
  email?: string;
  title?: string;
  department?: string;
  avatar?: string;
}

export interface AccessTokenClaims {
  sub: string;
  info?: UserInfoClaim;
  domain?: string;
  roles?: string[];
  [key: string]: unknown;
}

export function parseJwtPayload<T = AccessTokenClaims>(token: string): T {
  const base64Url = token.split('.')[1];
  if (!base64Url) throw new Error('Invalid JWT');
  const binary = base64Decode(base64Url);
  const percentEncoded = binary
    .split('')
    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
    .join('');
  return JSON.parse(decodeURIComponent(percentEncoded)) as T;
}
