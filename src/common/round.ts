/**
 * Rounds monetary and statistical values to the two decimals the API reports.
 */
export const ROUND_PRECISION = 2;

/**
 * Round to two decimals.
 *
 * This rounds the value the double actually holds rather than the decimal a
 * human would have typed: 15.995, whose nearest double is really
 * 15.99499999999999957, is not a midpoint at all and reports as 15.99. A value
 * that genuinely is an exact midpoint, such as 0.125, breaks towards the even
 * digit. Both behaviours match PHP's sprintf('%.2F'), which the Laravel app
 * uses, and neither is what JavaScript's toFixed would give.
 */
export function roundMoney(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return value;
  }

  const negative = value < 0 || Object.is(value, -0);
  const { digits, exponent } = exactDecimal(Math.abs(value));

  // Scale the exact decimal to two fractional digits, keeping the remainder so
  // ties can be detected without any floating point involved.
  const shift = exponent + ROUND_PRECISION;
  let quotient: bigint;
  let isTie = false;
  let roundUp = false;

  if (shift >= 0) {
    quotient = digits * 10n ** BigInt(shift);
  } else {
    const divisor = 10n ** BigInt(-shift);
    quotient = digits / divisor;
    const remainder = digits % divisor;
    const half = divisor / 2n;

    isTie = remainder === half;
    roundUp = remainder > half;
  }

  if (roundUp || (isTie && quotient % 2n === 1n)) {
    quotient += 1n;
  }

  const rounded = Number(quotient) / 10 ** ROUND_PRECISION;

  return negative ? -rounded : rounded;
}

/**
 * The exact decimal value of a finite non-negative double, as `digits` times
 * ten to the `exponent`. Doubles are binary fractions, so their exact decimal
 * expansion always terminates and fits in a BigInt.
 */
function exactDecimal(value: number): { digits: bigint; exponent: number } {
  if (value === 0) {
    return { digits: 0n, exponent: 0 };
  }

  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);

  const high = view.getUint32(0);
  const low = view.getUint32(4);
  const rawExponent = (high >>> 20) & 0x7ff;
  const rawMantissa = (BigInt(high & 0xfffff) << 32n) | BigInt(low);

  // Subnormals have no implicit leading bit and a fixed exponent.
  const mantissa = rawExponent === 0 ? rawMantissa : rawMantissa | (1n << 52n);
  const binaryExponent = (rawExponent === 0 ? 1 : rawExponent) - 1075;

  if (binaryExponent >= 0) {
    return { digits: mantissa << BigInt(binaryExponent), exponent: 0 };
  }

  // mantissa / 2^n equals mantissa * 5^n / 10^n, which is exact in base ten.
  return {
    digits: mantissa * 5n ** BigInt(-binaryExponent),
    exponent: binaryExponent,
  };
}
