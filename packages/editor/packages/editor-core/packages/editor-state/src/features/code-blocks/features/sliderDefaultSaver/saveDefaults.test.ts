import type { CodeBlockGraphicData, PianoKeyboard, State } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { getControlDefaultEdits } from './saveDefaults';

function createProjectState(blocks: CodeBlockGraphicData[], read: State['callbacks']['getWordFromMemory']): State {
	const state = createMockState();
	state.codeBlockRendering.rootCodeBlocks = blocks;
	state.codeBlockRendering.codeBlocks = blocks;
	state.callbacks.getWordFromMemory = read;
	return state;
}

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

	return (allocationUnitAddress: number) => int32[allocationUnitAddress] ?? 0;
}

describe('save slider default values to code', () => {
	it('updates scalar memory defaults from runtime slider values', () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float foo 1.3', 'int bar 1', '; @slider &foo', '; @slider &bar', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				moduleId: 'synth',
				id: 'foo',
				allocationUnitAddress: 4,
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
				moduleId: 'synth',
				id: 'bar',
				allocationUnitAddress: 5,
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

		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'float32', value: 0.75 },
				5: { type: 'int32', value: 7 },
			})
		);

		const edits = getControlDefaultEdits(state, codeBlock);
		expect(edits).toEqual([
			{
				codeBlock,
				code: ['module synth', 'float foo 0.75', 'int bar 7', '; @slider &foo', '; @slider &bar', 'moduleEnd'],
			},
		]);
		expect(edits[0].codeBlock).toBe(codeBlock);
	});

	it('adds missing scalar defaults and preserves inline comments', () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float gain ; @slider &gain 0 1 0.01', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				moduleId: 'synth',
				id: 'gain',
				allocationUnitAddress: 8,
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

		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				8: { type: 'float32', value: 1 },
			})
		);

		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{ codeBlock, code: ['module synth', 'float gain 1.0 ; @slider &gain 0 1 0.01', 'moduleEnd'] },
		]);
	});

	it('rounds float32 values according to the slider step', () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float gain 0.0', '; @slider &gain 0 1 0.01', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				moduleId: 'synth',
				id: 'gain',
				allocationUnitAddress: 4,
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

		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'float32', value: 0.699999988079071 },
			})
		);

		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{ codeBlock, code: ['module synth', 'float gain 0.7', '; @slider &gain 0 1 0.01', 'moduleEnd'] },
		]);
	});

	it('decodes float64 slider values from paired raw words', () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float64 phase 0.0', '; @slider &phase 0 4 0.001', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				moduleId: 'synth',
				id: 'phase',
				allocationUnitAddress: 4,
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

		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'float64', value: Math.PI },
			})
		);

		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{ codeBlock, code: ['module synth', 'float64 phase 3.142', '; @slider &phase 0 4 0.001', 'moduleEnd'] },
		]);
	});

	it('skips sliders when runtime memory cannot be read', () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float foo 1.3', '; @slider &foo', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				moduleId: 'synth',
				id: 'foo',
				allocationUnitAddress: 4,
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

		const state = createProjectState([codeBlock], undefined);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([]);
	});

	it('skips sliders without a matching named scalar declaration', () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float other 1.3', '; @slider &foo', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				moduleId: 'synth',
				id: 'foo',
				allocationUnitAddress: 4,
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

		const state = createProjectState([codeBlock], createRawMemoryReader({ 4: { type: 'float32', value: 0.75 } }));
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([]);
	});
});

function createPianoCodeBlock(
	code = ['module synth', 'int[] notes 4 48', 'int count 1', '; @piano &notes &count 48', 'moduleEnd']
) {
	const codeBlock = createMockCodeBlock({ name: 'synth', blockType: 'module', code });
	codeBlock.widgets.pianoKeyboards = [
		{
			pressedKeysListModuleId: 'synth',
			pressedNumberOfKeysModuleId: 'synth',
			lineNumber: 3,
			pressedKeysListMemory: {
				id: 'notes',
				allocationUnitAddress: 4,
				numberOfElements: 4,
				elementWordSize: 4,
				isInteger: true,
			},
			pressedNumberOfKeysMemory: { id: 'count', allocationUnitAddress: 8, isInteger: true },
		} as PianoKeyboard,
	];
	return codeBlock;
}

describe('save piano default values to code', () => {
	it('preserves two unchanged notes using byte-sized compiler metadata', () => {
		const codeBlock = createPianoCodeBlock([
			'module synth',
			'int[] notes 2 2 3',
			'int count 2',
			'; @piano &notes &count',
			'moduleEnd',
		]);
		codeBlock.widgets.pianoKeyboards[0].pressedKeysListMemory.numberOfElements = 2;
		codeBlock.widgets.pianoKeyboards[0].pressedNumberOfKeysMemory.allocationUnitAddress = 6;
		const memory = new Map([
			[4, 2],
			[5, 3],
			[6, 2],
			[8, 19],
		]);

		const state = createProjectState([codeBlock], address => memory.get(address) ?? 0);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([]);
		expect(codeBlock.code[1]).toBe('int[] notes 2 2 3');
	});

	it('saves the active runtime notes and count while preserving array size expressions and comments', () => {
		const codeBlock = createPianoCodeBlock([
			'module synth',
			'  int[] notes CAPACITY 48 49 ; chord',
			'int count 2 ; active notes',
			'; @piano &notes &count 48',
			'int unrelated 42',
			'moduleEnd',
		]);
		const original = [...codeBlock.code];
		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'int32', value: 36 },
				5: { type: 'int32', value: 52 },
				6: { type: 'int32', value: 84 },
				7: { type: 'int32', value: 99 },
				8: { type: 'int32', value: 3 },
			})
		);

		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{
				codeBlock,
				code: [
					'module synth',
					'  int[] notes CAPACITY 36 52 84 ; chord',
					'int count 3 ; active notes',
					'; @piano &notes &count 48',
					'int unrelated 42',
					'moduleEnd',
				],
			},
		]);
		expect(codeBlock.code).toEqual(original);
	});

	it('clears array defaults when no notes are pressed', () => {
		const codeBlock = createPianoCodeBlock();
		const state = createProjectState([codeBlock], () => 0);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{ codeBlock, code: ['module synth', 'int[] notes 4', 'int count 0', '; @piano &notes &count 48', 'moduleEnd'] },
		]);
	});

	it('decodes float32 notes and keeps floating-point literal syntax', () => {
		const codeBlock = createPianoCodeBlock([
			'module synth',
			'float[] notes 4 48.0',
			'int count 1',
			'; @piano &notes &count 48',
			'moduleEnd',
		]);
		codeBlock.widgets.pianoKeyboards[0].pressedKeysListMemory.isInteger = false;
		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'float32', value: 50 },
				5: { type: 'float32', value: 52 },
				8: { type: 'int32', value: 2 },
			})
		);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{
				codeBlock,
				code: ['module synth', 'float[] notes 4 50.0 52.0', 'int count 2', '; @piano &notes &count 48', 'moduleEnd'],
			},
		]);
	});

	it('bounds the count to the array capacity before reading notes', () => {
		const reader = createRawMemoryReader({
			4: { type: 'int32', value: 48 },
			5: { type: 'int32', value: 50 },
			6: { type: 'int32', value: 52 },
			7: { type: 'int32', value: 54 },
			8: { type: 'int32', value: 100 },
		});
		const codeBlock = createPianoCodeBlock();
		const state = createProjectState([codeBlock], reader);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{
				codeBlock,
				code: ['module synth', 'int[] notes 4 48 50 52 54', 'int count 4', '; @piano &notes &count 48', 'moduleEnd'],
			},
		]);
	});

	it('does nothing when defaults already match runtime memory', () => {
		const codeBlock = createPianoCodeBlock();
		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'int32', value: 48 },
				8: { type: 'int32', value: 1 },
			})
		);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([]);
	});

	it('skips both defaults when a matching declaration is missing', () => {
		const codeBlock = createPianoCodeBlock([
			'module synth',
			'int[] other 4',
			'int count 1',
			'; @piano &notes &count 48',
			'moduleEnd',
		]);
		const state = createProjectState([codeBlock], () => 0);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([]);
	});

	it('edits the canonical owner when local declarations have the same names', () => {
		const codeBlock = createPianoCodeBlock([
			'module synth',
			'int[] notes 4 48',
			'int count 1',
			'; @piano &other:notes &other:count 48',
			'moduleEnd',
		]);
		codeBlock.widgets.pianoKeyboards[0].pressedKeysListModuleId = 'other';
		codeBlock.widgets.pianoKeyboards[0].pressedNumberOfKeysModuleId = 'other';
		const owner = createMockCodeBlock({
			blockType: 'module',
			code: ['module other', 'int[] notes 4 60', 'int count 1', 'moduleEnd'],
		});
		const originalSource = [...codeBlock.code];
		const originalOwner = [...owner.code];
		const state = createProjectState([codeBlock, owner], () => 0);
		const edits = getControlDefaultEdits(state, codeBlock);
		expect(edits).toEqual([{ codeBlock: owner, code: ['module other', 'int[] notes 4', 'int count 0', 'moduleEnd'] }]);
		expect(edits[0].codeBlock).toBe(owner);
		expect(codeBlock.code).toEqual(originalSource);
		expect(owner.code).toEqual(originalOwner);
	});

	it('allows references explicitly qualified with the current module', () => {
		const codeBlock = createPianoCodeBlock([
			'module synth',
			'int[] notes 4 48',
			'int count 1',
			'; @piano &synth:notes &synth:count 48',
			'moduleEnd',
		]);
		const state = createProjectState([codeBlock], () => 0);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{
				codeBlock,
				code: ['module synth', 'int[] notes 4', 'int count 0', '; @piano &synth:notes &synth:count 48', 'moduleEnd'],
			},
		]);
	});

	it('skips invalid floating-point runtime values without saving a partial count', () => {
		const codeBlock = createPianoCodeBlock();
		codeBlock.widgets.pianoKeyboards[0].pressedKeysListMemory.isInteger = false;
		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'float32', value: Number.NaN },
				8: { type: 'int32', value: 1 },
			})
		);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([]);
	});

	it('skips saving when runtime memory cannot be read', () => {
		const codeBlock = createPianoCodeBlock();
		const state = createProjectState([codeBlock], undefined);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([]);
	});

	it('saves sliders and piano defaults together', () => {
		const codeBlock = createPianoCodeBlock([
			'module synth',
			'int[] notes 4 48',
			'int count 1',
			'; @piano &notes &count 48',
			'float gain 0.5',
			'; @slider &gain 0 1 0.01',
			'moduleEnd',
		]);
		codeBlock.widgets.sliders = [
			{
				moduleId: 'synth',
				id: 'gain',
				allocationUnitAddress: 9,
				byteAddress: 36,
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
		const state = createProjectState(
			[codeBlock],
			createRawMemoryReader({
				4: { type: 'int32', value: 50 },
				8: { type: 'int32', value: 1 },
				9: { type: 'float32', value: 0.75 },
			})
		);
		expect(getControlDefaultEdits(state, codeBlock)).toEqual([
			{
				codeBlock,
				code: [
					'module synth',
					'int[] notes 4 50',
					'int count 1',
					'; @piano &notes &count 48',
					'float gain 0.75',
					'; @slider &gain 0 1 0.01',
					'moduleEnd',
				],
			},
		]);
	});
});
