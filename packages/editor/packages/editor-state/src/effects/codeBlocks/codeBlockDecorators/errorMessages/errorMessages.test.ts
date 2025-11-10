import { describe, it, expect, beforeEach } from 'vitest';

import errorMessages from './errorMessages';

import { createMockCodeBlock, createMockState } from '../../../../helpers/testUtils';

import type { CodeBlockGraphicData, State } from '../../../../types';

describe('errorMessages', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			gaps: new Map(),
		});

		mockState = createMockState({
			graphicHelper: {
				globalViewport: {
					vGrid: 10,
					hGrid: 20,
				},
			},
			compiler: {
				buildErrors: [
					{
						moduleId: 'test-block',
						lineNumber: 2,
						message: 'Syntax error',
					},
				],
			},
		} as any);
	});

	it('should add error message to graphicData extras', () => {
		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.size).toBe(1);
		expect(mockGraphicData.extras.errorMessages.has(2)).toBe(true);
	});

	it('should calculate correct position and message', () => {
		errorMessages(mockGraphicData, mockState);

		const error = mockGraphicData.extras.errorMessages.get(2);
		expect(error).toMatchSnapshot();
	});

	it('should handle multiple error messages', () => {
		mockState.compiler.buildErrors = [
			{
				moduleId: 'test-block',
				lineNumber: 1,
				message: 'First error',
			},
			{
				moduleId: 'test-block',
				lineNumber: 3,
				message: 'Second error',
			},
		];

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.size).toBe(2);
		expect(Array.from(mockGraphicData.extras.errorMessages.entries())).toMatchSnapshot();
	});

	it('should ignore errors from different modules', () => {
		mockState.compiler.buildErrors = [
			{
				moduleId: 'test-block',
				lineNumber: 1,
				message: 'My error',
			},
			{
				moduleId: 'other-block',
				lineNumber: 2,
				message: 'Other error',
			},
		];

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.size).toBe(1);
		expect(mockGraphicData.extras.errorMessages.has(1)).toBe(true);
		expect(mockGraphicData.extras.errorMessages.has(2)).toBe(false);
	});

	it('should clear existing error messages before updating', () => {
		mockGraphicData.extras.errorMessages.set(5, {
			x: 0,
			y: 0,
			message: ['Old error'],
		});

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.has(5)).toBe(false);
	});

	it('should handle empty build errors', () => {
		mockState.compiler.buildErrors = [];

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.size).toBe(0);
	});

	it('should position errors correctly with gaps', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]); // Gap at line 1
		mockState.compiler.buildErrors = [
			{
				moduleId: 'test-block',
				lineNumber: 2,
				message: 'Error after gap',
			},
		];

		errorMessages(mockGraphicData, mockState);

		const error = mockGraphicData.extras.errorMessages.get(2);
		// gapCalculator should account for gaps
		expect(error).toBeDefined();
		expect(error?.y).toBeGreaterThan(0);
	});
});
