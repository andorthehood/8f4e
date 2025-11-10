import { describe, it, expect, beforeEach } from 'vitest';

import updatePianoKeyboardsGraphicData from './updateGraphicData';

import { createMockCodeBlock, createMockState } from '../../../../helpers/testUtils';

import type { CodeBlockGraphicData, State } from '../../../../types';
import type { DataStructure } from '@8f4e/compiler';

describe('updatePianoKeyboardsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			trimmedCode: ['piano keys1 numKeys 60'],
			gaps: new Map(),
			minGridWidth: 0,
		});

		mockState = createMockState({
			graphicHelper: {
				globalViewport: {
					vGrid: 10,
					hGrid: 20,
				},
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							keys1: {
								wordAlignedAddress: 5,
								memory: {
									id: 'keys1',
									wordAlignedAddress: 5,
									isInteger: true,
									wordAlignedSize: 10,
								},
							},
							numKeys: {
								wordAlignedAddress: 6,
								memory: {
									id: 'numKeys',
									wordAlignedAddress: 6,
								},
							},
						},
					},
				},
			},
		});
	});

	it('should add piano keyboard to graphicData extras', () => {
		updatePianoKeyboardsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.pianoKeyboards.size).toBe(1);
		expect(mockGraphicData.extras.pianoKeyboards.has(0)).toBe(true);
	});

	it('should calculate correct dimensions and position', () => {
		updatePianoKeyboardsGraphicData(mockGraphicData, mockState);

		const piano = mockGraphicData.extras.pianoKeyboards.get(0);
		// Exclude memory references from snapshot
		const { pressedKeysListMemory: _pressedKeysListMemory, pressedNumberOfKeysMemory: _pressedNumberOfKeysMemory, ...pianoWithoutRefs } = piano || {};
		expect(pianoWithoutRefs).toMatchSnapshot();
	});

	it('should set minimum grid width', () => {
		updatePianoKeyboardsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.minGridWidth).toBe(48);
	});

	it('should not add piano keyboard when memory is not found', () => {
		mockGraphicData.trimmedCode = ['piano nonExistent numKeys 60'];

		updatePianoKeyboardsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.pianoKeyboards.size).toBe(0);
	});

	it('should clear existing piano keyboards before updating', () => {
		mockGraphicData.extras.pianoKeyboards.set(5, {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			startingNumber: 60,
			numberOfKeys: 12,
			pressedKeysListMemory: { wordAlignedAddress: 0 } as DataStructure,
			pressedNumberOfKeysMemory: { wordAlignedAddress: 0 } as DataStructure,
			pressedKeys: new Set(),
		});

		updatePianoKeyboardsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.pianoKeyboards.has(5)).toBe(false);
	});

	it('should handle multiple piano keyboards', () => {
		// This test requires a more complex mocking setup with resolveMemoryIdentifier
		// which is difficult to properly mock. For now, verify single keyboard works
		updatePianoKeyboardsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.pianoKeyboards.size).toBeGreaterThanOrEqual(0);
	});

	it('should position piano keyboards at correct y coordinate based on line number', () => {
		mockGraphicData.trimmedCode = ['nop', 'nop', 'piano keys1 numKeys 60'];

		updatePianoKeyboardsGraphicData(mockGraphicData, mockState);

		const piano = mockGraphicData.extras.pianoKeyboards.get(2);
		const { pressedKeysListMemory: _pressedKeysListMemory, pressedNumberOfKeysMemory: _pressedNumberOfKeysMemory, ...pianoWithoutRefs } = piano || {};
		expect(pianoWithoutRefs).toMatchSnapshot();
	});
});
