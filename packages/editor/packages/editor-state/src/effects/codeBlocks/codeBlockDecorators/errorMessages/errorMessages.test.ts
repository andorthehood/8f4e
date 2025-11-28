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
				viewport: {
					vGrid: 10,
					hGrid: 20,
				},
			},
			compiler: {
				compilationErrors: [
					{
						moduleId: 'test-block',
						lineNumber: 2,
						code: 0,
						message: 'Syntax error',
					},
				],
			},
		});
	});

	it('should add error message to graphicData extras', () => {
		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.length).toBe(1);
		expect(mockGraphicData.extras.errorMessages[0]).toBeDefined();
		expect(mockGraphicData.extras.errorMessages[0].lineNumber).toBe(2);
	});

	it('should calculate correct position and message', () => {
		errorMessages(mockGraphicData, mockState);

		const error = mockGraphicData.extras.errorMessages[0];
		expect(error).toMatchSnapshot();
	});

	it('should handle multiple error messages', () => {
		mockState.compiler.compilationErrors = [
			{
				moduleId: 'test-block',
				lineNumber: 1,
				code: 0,
				message: 'First error',
			},
			{
				moduleId: 'test-block',
				lineNumber: 3,
				code: 0,
				message: 'Second error',
			},
		];

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.length).toBe(2);
		expect(mockGraphicData.extras.errorMessages).toMatchSnapshot();
	});

	it('should ignore errors from different modules', () => {
		mockState.compiler.compilationErrors = [
			{
				moduleId: 'test-block',
				lineNumber: 1,
				code: 0,
				message: 'My error',
			},
			{
				moduleId: 'other-block',
				lineNumber: 2,
				code: 0,
				message: 'Other error',
			},
		];

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.length).toBe(1);
		expect(mockGraphicData.extras.errorMessages[0].lineNumber).toBe(1);
	});

	it('should clear existing error messages before updating', () => {
		mockGraphicData.extras.errorMessages.push({
			x: 0,
			y: 0,
			message: ['Old error'],
			lineNumber: 5,
		});

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.find(e => e.lineNumber === 5)).toBeUndefined();
	});

	it('should handle empty build errors', () => {
		mockState.compiler.compilationErrors = [];

		errorMessages(mockGraphicData, mockState);

		expect(mockGraphicData.extras.errorMessages.length).toBe(0);
	});

	it('should position errors correctly with gaps', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]); // Gap at line 1
		mockState.compiler.compilationErrors = [
			{
				moduleId: 'test-block',
				lineNumber: 2,
				code: 0,
				message: 'Error after gap',
			},
		];

		errorMessages(mockGraphicData, mockState);

		const error = mockGraphicData.extras.errorMessages[0];
		// gapCalculator should account for gaps
		expect(error).toBeDefined();
		expect(error?.y).toBeGreaterThan(0);
	});
});
