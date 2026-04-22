function generateMinBlepTable({ zeroCrossings = 16, oversampling = 16 } = {}) {
	const halfLen = zeroCrossings * oversampling;
	const fullLen = halfLen * 2 + 1;

	const sinc = new Float64Array(fullLen);

	// Windowed sinc impulse centered at 0
	for (let i = 0; i < fullLen; i++) {
		const x = (i - halfLen) / oversampling;

		const s = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);

		// Blackman window
		const w =
			0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (fullLen - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (fullLen - 1));

		sinc[i] = s * w;
	}

	// Normalize impulse area to 1
	let sum = 0;
	for (let i = 0; i < fullLen; i++) sum += sinc[i];
	for (let i = 0; i < fullLen; i++) sinc[i] /= sum;

	// Integrate to get band-limited step
	const step = new Float64Array(fullLen);
	let acc = 0;
	for (let i = 0; i < fullLen; i++) {
		acc += sinc[i];
		step[i] = acc;
	}

	// Residual minBLEP correction:
	// right half of (1 - step), centered at the discontinuity
	const table = new Float64Array(halfLen + 1);
	for (let i = 0; i <= halfLen; i++) {
		table[i] = 1 - step[halfLen + i];
	}

	return Array.from(table);
}

const minBLEPLUT = `module minBLEPLUT
; @tab 7
; minBLEP correction table
; for smoothing oscillator
; discontinuities.
; Use it to band-limit 
; hard edges.
${generateMinBlepTable({ zeroCrossings: 16, oversampling: 16 })
	.map(value => {
		return `float	${value.toFixed(16)}`;
	})
	.join('\n')}

moduleEnd`;

export default minBLEPLUT;
