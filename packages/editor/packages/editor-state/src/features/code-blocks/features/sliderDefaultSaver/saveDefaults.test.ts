import { describe, expect, it } from 'vitest';
import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { saveSliderDefaultValuesToCode } from './saveDefaults';

function createRawMemoryReader(values: Record<number, { type: 'int32' | 'float32' | 'float64'; value: number }>) {
	const buffer = new ArrayBuffer(64);
	const int32 = new Int32Array(buffer);
	const float32 = new Float32Array(buffer);
	const float64 = new Float64Array(buffer);

	for (const [address, entry] of Object.entries(values)) {
		const wordAddress = Number.parseInt(address, 10);
		if (entry.type === 'int32') {
			int32[wordAddress] = entry.value;
		} else if (entry.type === 'float32') {
			float32[wordAddress] = entry.value;
		} else {
			float64[wordAddress / 2] = entry.value;
		}
	}

	return (wordAlignedAddress: number) => int32[wordAlignedAddress] ?? 0;
}

describe('save slider default values to code', () => {
	it('updates scalar memory defaults from runtime slider values', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module synth', 'float foo 1.3', 'int bar 1', '; @slider &foo', '; @slider &bar', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				id: 'foo',
				wordAlignedAddress: 4,
				byteAddress: 16,
				isInteger: false,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 1,
			},
			{
				id: 'bar',
				wordAlignedAddress: 5,
				byteAddress: 20,
				isInteger: true,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 10,
			},
		];

		const result = saveSliderDefaultValuesToCode(
			codeBlock,
			createRawMemoryReader({
				4: { type: 'float32', value: 0.75 },
				5: { type: 'int32', value: 7 },
			})
		);

		expect(result).toEqual([
			'module synth',
			'float foo 0.75',
			'int bar 7',
			'; @slider &foo',
			'; @slider &bar',
			'moduleEnd',
		]);
	});

	it('adds missing scalar defaults and preserves inline comments', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module synth', 'float gain ; @slider &gain 0 1 0.01', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				id: 'gain',
				wordAlignedAddress: 8,
				byteAddress: 32,
				isInteger: false,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 1,
				step: 0.01,
			},
		];

		const result = saveSliderDefaultValuesToCode(
			codeBlock,
			createRawMemoryReader({
				8: { type: 'float32', value: 1 },
			})
		);

		expect(result).toEqual(['module synth', 'float gain 1.0 ; @slider &gain 0 1 0.01', 'moduleEnd']);
	});

	it('rounds float32 values according to the slider step', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module synth', 'float gain 0.0', '; @slider &gain 0 1 0.01', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				id: 'gain',
				wordAlignedAddress: 4,
				byteAddress: 16,
				isInteger: false,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 1,
				step: 0.01,
			},
		];

		const result = saveSliderDefaultValuesToCode(
			codeBlock,
			createRawMemoryReader({
				4: { type: 'float32', value: 0.699999988079071 },
			})
		);

		expect(result).toEqual(['module synth', 'float gain 0.7', '; @slider &gain 0 1 0.01', 'moduleEnd']);
	});

	it('decodes float64 slider values from paired raw words', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module synth', 'float64 phase 0.0', '; @slider &phase 0 4 0.001', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				id: 'phase',
				wordAlignedAddress: 4,
				byteAddress: 16,
				isInteger: false,
				isFloat64: true,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 4,
				step: 0.001,
			},
		];

		const result = saveSliderDefaultValuesToCode(
			codeBlock,
			createRawMemoryReader({
				4: { type: 'float64', value: Math.PI },
			})
		);

		expect(result).toEqual(['module synth', 'float64 phase 3.142', '; @slider &phase 0 4 0.001', 'moduleEnd']);
	});

	it('skips sliders when runtime memory cannot be read', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module synth', 'float foo 1.3', '; @slider &foo', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				id: 'foo',
				wordAlignedAddress: 4,
				byteAddress: 16,
				isInteger: false,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 1,
			},
		];

		expect(saveSliderDefaultValuesToCode(codeBlock, undefined)).toBeUndefined();
	});

	it('skips sliders without a matching named scalar declaration', () => {
		const codeBlock = createMockCodeBlock({
			code: ['module synth', 'float other 1.3', '; @slider &foo', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				id: 'foo',
				wordAlignedAddress: 4,
				byteAddress: 16,
				isInteger: false,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 1,
			},
		];

		expect(
			saveSliderDefaultValuesToCode(codeBlock, createRawMemoryReader({ 4: { type: 'float32', value: 0.75 } }))
		).toBeUndefined();
	});
});
