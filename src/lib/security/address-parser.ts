import { address, getAddressEncoder, getAddressDecoder, isOffCurveAddress } from '@solana/kit';
export function parseAddress(input: string) {
  // Trim only ordinary surrounding whitespace. Hidden/non-ASCII characters always fail.
  const value = input.replace(/^[\t\n\r ]+|[\t\n\r ]+$/g, '');
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) throw new Error('Enter a full base58 address. Hidden characters, Unicode and internal spaces are not allowed.');
  try {
    const key = address(value);
    const bytes = getAddressEncoder().encode(key);
    if (bytes.length !== 32 || getAddressDecoder().decode(bytes) !== value) throw new Error('Noncanonical address');
    return { address: key, onCurve: !isOffCurveAddress(key) };
  } catch { throw new Error('A Solana address must canonically decode to exactly 32 bytes.'); }
}
