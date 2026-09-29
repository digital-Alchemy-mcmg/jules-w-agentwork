/**
 * Deterministic Lowercase Alphanumeric Outline Addressing Engine.
 *
 * Implements the stable structural address pattern:
 * - Top level: a, b, c, ...
 * - Sub level 1: a1, a2, a3, ...
 * - Sub level 2: a1a, a1b, a1c, ...
 * - Sub level 3: a1a1, a1a2, ...
 * - Sub level 4: a1a1a, a1a1b, ...
 */

export function intToAlpha(n: number): string {
  if (n < 0) {
    throw new Error(`Index must be non-negative: ${n}`);
  }
  const result: string[] = [];
  while (true) {
    result.push(String.fromCharCode('a'.charCodeAt(0) + (n % 26)));
    n = Math.floor(n / 26);
    if (n === 0) {
      break;
    }
    n -= 1;
  }
  return result.reverse().join('');
}

export function assignChildAddress(parentAddress: string, childIndex: number): string {
  if (!parentAddress) {
    return intToAlpha(childIndex);
  }

  const lastChar = parentAddress[parentAddress.length - 1];
  if (/[a-zA-Z]/.test(lastChar)) {
    // Append 1-indexed number
    return `${parentAddress}${childIndex + 1}`;
  } else if (/[0-9]/.test(lastChar)) {
    // Append letter
    return `${parentAddress}${intToAlpha(childIndex)}`;
  } else {
    throw new Error(`Invalid parent address format: ${parentAddress}`);
  }
}

export function validateAddressFormat(address: string): boolean {
  return !!address && /^[a-z0-9]+$/.test(address);
}
