// Decimal fixed-point arithmetic for offline table generation. Sixty internal decimal places leave
// ample precision after the minBLEP logarithm's 1e-30 squared-magnitude floor and final 18-place output.
export const SCALE = 10n ** 60n;

export function fixed(value: string): bigint {
	const negative = value.startsWith('-');
	const [integer, fraction = ''] = (negative ? value.slice(1) : value).split('.');
	const magnitude = BigInt(integer) * SCALE + BigInt(fraction.padEnd(60, '0').slice(0, 60));
	return negative ? -magnitude : magnitude;
}

export function multiply(left: bigint, right: bigint): bigint {
	return (left * right) / SCALE;
}

export function divide(left: bigint, right: bigint): bigint {
	return (left * SCALE) / right;
}

function atanReciprocal(denominator: bigint): bigint {
	const squared = denominator * denominator;
	let power = SCALE / denominator;
	let sum = 0n;
	for (let n = 1n; power !== 0n; n += 2n) {
		sum += power / n;
		power = -power / squared;
	}
	return sum;
}

// Machin's identity computes pi entirely with integer arithmetic.
export const PI = 16n * atanReciprocal(5n) - 4n * atanReciprocal(239n);

// log(x) = 2 * (z + z^3/3 + z^5/5 + ...), z = (x-1)/(x+1), for 1 <= x <= 2.
// Series references: https://dlmf.nist.gov/4.6 and https://dlmf.nist.gov/4.19
function logUnit(value: bigint): bigint {
	const z = divide(value - SCALE, value + SCALE);
	const squared = multiply(z, z);
	let sum = 0n;
	for (let power = z, n = 1n; power !== 0n; power = multiply(power, squared), n += 2n) {
		sum += power / n;
	}
	return 2n * sum;
}

const LN2 = logUnit(2n * SCALE);

export function log(value: bigint): bigint {
	if (value <= 0n) throw new Error('Fixed-point logarithm requires a positive value');
	let exponent = 0n;
	while (value < SCALE) {
		value *= 2n;
		exponent--;
	}
	while (value >= 2n * SCALE) {
		value /= 2n;
		exponent++;
	}
	return logUnit(value) + exponent * LN2;
}

export function exp(value: bigint): bigint {
	const exponent = value / LN2;
	const remainder = value - exponent * LN2;
	let sum = SCALE;
	for (let term = SCALE, n = 1n; term !== 0n; n++) {
		term = multiply(term, remainder) / n;
		sum += term;
	}
	return exponent >= 0n ? sum * 2n ** exponent : sum / 2n ** -exponent;
}

export function sinCos(angle: bigint): { sin: bigint; cos: bigint } {
	let reduced = angle % (2n * PI);
	if (reduced > PI) reduced -= 2n * PI;
	if (reduced < -PI) reduced += 2n * PI;
	let cosSign = 1n;
	if (reduced > PI / 2n) {
		reduced = PI - reduced;
		cosSign = -1n;
	} else if (reduced < -PI / 2n) {
		reduced = -PI - reduced;
		cosSign = -1n;
	}

	const squared = multiply(reduced, reduced);
	let sin = reduced;
	let cos = SCALE;
	let sinTerm = reduced;
	let cosTerm = SCALE;
	for (let n = 1n; sinTerm !== 0n || cosTerm !== 0n; n++) {
		sinTerm = -multiply(sinTerm, squared) / (2n * n * (2n * n + 1n));
		cosTerm = -multiply(cosTerm, squared) / ((2n * n - 1n) * 2n * n);
		sin += sinTerm;
		cos += cosTerm;
	}
	return { sin, cos: cosSign * cos };
}

// Emit a floating-point source literal only at the output boundary, without a binary-float round trip.
export function toDecimal(value: bigint): string {
	const decimalScale = 10n ** 18n;
	const divisor = SCALE / decimalScale;
	const magnitude = value < 0n ? -value : value;
	const rounded = (magnitude + divisor / 2n) / divisor;
	const sign = value < 0n && rounded !== 0n ? '-' : '';
	return `${sign}${rounded / decimalScale}.${(rounded % decimalScale).toString().padStart(18, '0')}`;
}
