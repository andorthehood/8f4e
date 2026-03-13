import { describe, it, expect } from 'vitest';

import parseSliderDirectives from '../directives/slider/parse';

describe('parseSliderDirectives', () => {
	it('should parse slider instruction with memory id only', () => {
		const code = ['; @slider mySlider'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([
			{
				id: 'mySlider',
				lineNumber: 0,
				min: undefined,
				max: undefined,
				step: undefined,
			},
		]);
	});

	it('should parse slider instruction with min and max', () => {
		const code = ['; @slider mySlider 0 100'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([
			{
				id: 'mySlider',
				lineNumber: 0,
				min: 0,
				max: 100,
				step: undefined,
			},
		]);
	});

	it('should parse slider instruction with min, max, and step', () => {
		const code = ['; @slider mySlider 0 100 10'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([
			{
				id: 'mySlider',
				lineNumber: 0,
				min: 0,
				max: 100,
				step: 10,
			},
		]);
	});

	it('should parse slider instruction with float values', () => {
		const code = ['; @slider mySlider 0.0 1.0 0.01'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([
			{
				id: 'mySlider',
				lineNumber: 0,
				min: 0.0,
				max: 1.0,
				step: 0.01,
			},
		]);
	});

	it('should handle multiple slider instructions', () => {
		const code = ['; @slider slider1 0 100', 'mov a b', '; @slider slider2 0.0 1.0'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([
			{
				id: 'slider1',
				lineNumber: 0,
				min: 0,
				max: 100,
				step: undefined,
			},
			{
				id: 'slider2',
				lineNumber: 2,
				min: 0.0,
				max: 1.0,
				step: undefined,
			},
		]);
	});

	it('should return empty array when no slider instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([]);
	});

	it('should preserve correct line numbers', () => {
		const code = ['nop', 'nop', '; @slider slider1 0 100', 'nop', 'nop', '; @slider slider2 0.0 1.0'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([
			{
				id: 'slider1',
				lineNumber: 2,
				min: 0,
				max: 100,
				step: undefined,
			},
			{
				id: 'slider2',
				lineNumber: 5,
				min: 0.0,
				max: 1.0,
				step: undefined,
			},
		]);
	});

	it('should handle negative values', () => {
		const code = ['; @slider mySlider -100 100 5'];
		const result = parseSliderDirectives(code);

		expect(result).toEqual([
			{
				id: 'mySlider',
				lineNumber: 0,
				min: -100,
				max: 100,
				step: 5,
			},
		]);
	});
});
