import { divide, exp, fixed, log, multiply, PI, SCALE, sinCos, toDecimal } from './fixedPoint.ts';

type MinBLEPApproximationOptions = {
	totalZeroCrossings: number;
	oversampling: number;
	cutoffRatio: bigint;
	fftSize: number;
	fractionalShift: bigint;
	outputGain: bigint;
	outputBias: bigint;
	includeInterpolationGuard: boolean;
};

// This generator follows the common MusicDSP minBLEP construction pipeline:
// Blackman-windowed sinc -> minimum-phase reconstruction via cepstrum folding
// -> integrated step residual.
//
// Source lineage:
// https://www.musicdsp.org/en/latest/Synthesis/211-matlab-octave-code-for-minblep-table-generation.html
//
// The constants below were then tuned so the generated residual tracks the
// ProTracker 2 clone lookup table closely:
// https://raw.githubusercontent.com/8bitbubsy/pt2-clone/master/src/pt2_blep.c
const DEFAULT_OPTIONS: MinBLEPApproximationOptions = {
	totalZeroCrossings: 16,
	oversampling: 16,
	cutoffRatio: fixed('0.9325'),
	fftSize: 4096,
	fractionalShift: fixed('-0.525'),
	outputGain: fixed('0.9857184887433783'),
	outputBias: fixed('0.00181097096978212'),
	includeInterpolationGuard: true,
};

function assertPowerOfTwo(value: number): void {
	if (!Number.isInteger(value) || value <= 0 || (value & (value - 1)) !== 0) {
		throw new Error(`Expected a positive power-of-two FFT size, received ${value}.`);
	}
}

function sinc(value: bigint): bigint {
	if (value === 0n) return SCALE;
	const radians = multiply(PI, value);
	return divide(sinCos(radians).sin, radians);
}

function blackmanWindow(index: number, size: number): bigint {
	if (size === 1) return SCALE;
	const phase = (2n * PI * BigInt(index)) / BigInt(size - 1);
	return fixed('0.42') - sinCos(phase).cos / 2n + multiply(fixed('0.08'), sinCos(2n * phase).cos);
}

function reverseBits(value: number, bitCount: number): number {
	let reversed = 0;

	for (let i = 0; i < bitCount; i++) {
		reversed = (reversed << 1) | (value & 1);
		value >>= 1;
	}

	return reversed;
}

function fftInPlace(real: bigint[], imag: bigint[], inverse: boolean, twiddles: ReturnType<typeof sinCos>[]): void {
	const size = real.length;
	const bitCount = size.toString(2).length - 1;
	const direction = inverse ? 1n : -1n;

	for (let index = 0; index < size; index++) {
		const swappedIndex = reverseBits(index, bitCount);
		if (swappedIndex <= index) {
			continue;
		}

		const swappedReal = real[index];
		const swappedImag = imag[index];

		real[index] = real[swappedIndex];
		imag[index] = imag[swappedIndex];
		real[swappedIndex] = swappedReal;
		imag[swappedIndex] = swappedImag;
	}

	for (let span = 2; span <= size; span <<= 1) {
		const halfSpan = span >> 1;

		for (let start = 0; start < size; start += span) {
			for (let offset = 0; offset < halfSpan; offset++) {
				const twiddle = twiddles[(offset * size) / span];
				const twiddleReal = twiddle.cos;
				const twiddleImag = direction * twiddle.sin;
				const leftIndex = start + offset;
				const rightIndex = leftIndex + halfSpan;

				const rightReal = multiply(twiddleReal, real[rightIndex]) - multiply(twiddleImag, imag[rightIndex]);
				const rightImag = multiply(twiddleReal, imag[rightIndex]) + multiply(twiddleImag, real[rightIndex]);

				real[rightIndex] = real[leftIndex] - rightReal;
				imag[rightIndex] = imag[leftIndex] - rightImag;
				real[leftIndex] += rightReal;
				imag[leftIndex] += rightImag;
			}
		}
	}

	if (!inverse) {
		return;
	}

	for (let index = 0; index < size; index++) {
		real[index] /= BigInt(size);
		imag[index] /= BigInt(size);
	}
}

function interpolateSignal(signal: readonly bigint[], position: bigint): bigint {
	if (position <= 0n) {
		return signal[0];
	}

	const lastIndex = signal.length - 1;
	if (position >= BigInt(lastIndex) * SCALE) {
		return signal[lastIndex];
	}

	const baseIndex = Number(position / SCALE);
	const fraction = position % SCALE;
	const start = signal[baseIndex];
	const end = signal[baseIndex + 1];

	return start + multiply(end - start, fraction);
}

function buildWindowedSinc(sampleCount: number, oversampling: number, cutoffRatio: bigint): bigint[] {
	const center = (BigInt(sampleCount - 1) * SCALE) / 2n;
	const normalizedCutoff = cutoffRatio / BigInt(2 * oversampling);
	const impulse = new Array<bigint>(sampleCount).fill(0n);

	for (let index = 0; index < sampleCount; index++) {
		const phase = BigInt(index) * SCALE - center;
		const window = blackmanWindow(index, sampleCount);
		impulse[index] = multiply(2n * normalizedCutoff, multiply(sinc(multiply(2n * normalizedCutoff, phase)), window));
	}

	return impulse;
}

function minimumPhaseImpulse(linearPhaseImpulse: bigint[], fftSize: number): bigint[] {
	const epsilonSquared = fixed('0.000000000000000000000000000001');
	const twiddles = Array.from({ length: fftSize / 2 }, (_, index) =>
		sinCos((2n * PI * BigInt(index)) / BigInt(fftSize))
	);
	const real = new Array<bigint>(fftSize).fill(0n);
	const imag = new Array<bigint>(fftSize).fill(0n);

	real.splice(0, linearPhaseImpulse.length, ...linearPhaseImpulse);
	fftInPlace(real, imag, false, twiddles);

	for (let index = 0; index < fftSize; index++) {
		const magnitudeSquared = multiply(real[index], real[index]) + multiply(imag[index], imag[index]);
		// log(hypot(re, im)) = log(re^2 + im^2) / 2; no square root is needed.
		real[index] = log(magnitudeSquared > epsilonSquared ? magnitudeSquared : epsilonSquared) / 2n;
		imag[index] = 0n;
	}

	fftInPlace(real, imag, true, twiddles);

	const foldedReal = new Array<bigint>(fftSize).fill(0n);
	const foldedImag = new Array<bigint>(fftSize).fill(0n);
	const midpoint = fftSize >> 1;

	foldedReal[0] = real[0];
	for (let index = 1; index < midpoint; index++) {
		foldedReal[index] = real[index] * 2n;
	}
	foldedReal[midpoint] = real[midpoint];

	fftInPlace(foldedReal, foldedImag, false, twiddles);

	for (let index = 0; index < fftSize; index++) {
		const magnitude = exp(foldedReal[index]);
		const phase = sinCos(foldedImag[index]);

		real[index] = multiply(magnitude, phase.cos);
		imag[index] = multiply(magnitude, phase.sin);
	}

	fftInPlace(real, imag, true, twiddles);

	return real;
}

function generateApproximatePt2MinBlepData(options: Partial<MinBLEPApproximationOptions> = {}): bigint[] {
	const resolved = { ...DEFAULT_OPTIONS, ...options };
	assertPowerOfTwo(resolved.fftSize);

	const sampleCount = resolved.totalZeroCrossings * resolved.oversampling + 1;
	const linearPhaseImpulse = buildWindowedSinc(sampleCount, resolved.oversampling, resolved.cutoffRatio);
	const minPhaseImpulse = minimumPhaseImpulse(linearPhaseImpulse, resolved.fftSize);

	const step = new Array<bigint>(sampleCount);
	let accumulator = 0n;
	for (let index = 0; index < sampleCount; index++) {
		accumulator += minPhaseImpulse[index];
		step[index] = accumulator;
	}

	const normalization = step[sampleCount - 1];
	const residual = step.map(value => SCALE - divide(value, normalization));
	const output = new Array<bigint>(sampleCount);

	for (let index = 0; index < sampleCount; index++) {
		const shifted = interpolateSignal(residual, BigInt(index) * SCALE + resolved.fractionalShift);
		output[index] = multiply(shifted, resolved.outputGain) + resolved.outputBias;
	}

	output[sampleCount - 1] = 0n;

	if (!resolved.includeInterpolationGuard) {
		return output;
	}

	return [...output, 0n];
}

const minBLEPData = generateApproximatePt2MinBlepData();

const minBLEPLUT = `entry main
module minBLEPLUT
; @public
; @tab 7
; PT2-style minBLEP correction table
; generated with integer fixed-point minBLEP arithmetic
${minBLEPData.map(value => `float\t${toDecimal(value)}`).join('\n')}

moduleEnd
entryEnd`;

export default minBLEPLUT;
