import { describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state/testing';

import drawConnections from './connections';

import type { Engine } from 'glugglug';
import type { Input, Output } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../../types';

function createMemoryViews({ int32 = [] }: { int32?: number[] } = {}): MemoryViews {
	return {
		int8: new Int8Array(0),
		int16: new Int16Array(0),
		int32: new Int32Array(int32),
		uint8: new Uint8Array(0),
		uint16: new Uint16Array(0),
		float32: new Float32Array(0),
		float64: new Float64Array(0),
	};
}

function createMockEngine(): Engine {
	return {
		startGroup: vi.fn(),
		endGroup: vi.fn(),
		setSpriteLookup: vi.fn(),
		drawLine: vi.fn(),
	} as unknown as Engine;
}

describe('drawConnections', () => {
	it('draws wires from the center of input and output widgets', () => {
		const inputBlock = createMockCodeBlock({
			moduleId: 'inputModule',
			x: 100,
			y: 200,
			offsetX: 7,
			offsetY: 11,
		});
		const outputBlock = createMockCodeBlock({
			moduleId: 'outputModule',
			x: 300,
			y: 400,
			offsetX: 13,
			offsetY: 17,
		});
		const input: Input = {
			codeBlock: inputBlock,
			width: 30,
			height: 18,
			x: 0,
			y: 36,
			wireX: 15,
			wireY: 45,
			id: 'in',
			wordAlignedAddress: 2,
		};
		const output: Output = {
			codeBlock: outputBlock,
			width: 30,
			height: 18,
			x: 140,
			y: 54,
			wireX: 155,
			wireY: 63,
			id: 'out',
			calibratedMax: 0,
			calibratedMin: 0,
			memory: {
				byteAddress: 80,
				wordAlignedAddress: 20,
				wordAlignedSize: 1,
			} as never,
		};
		inputBlock.widgets.inputs = [input];

		const state = createMockState({
			viewport: {
				x: 5,
				y: 9,
				vGrid: 10,
				hGrid: 18,
			},
			compiler: {
				compiledModules: {
					inputModule: {
						memoryMap: {
							in: {
								byteAddress: 8,
								wordAlignedAddress: 2,
								wordAlignedSize: 1,
							},
						},
					},
				},
			},
			graphicHelper: {
				codeBlocks: [inputBlock, outputBlock],
				selectedCodeBlock: inputBlock,
				outputsByWordAddress: new Map([[80, output]]),
				spriteLookups: {
					fillColors: {},
				} as never,
			},
		});
		const engine = createMockEngine();

		drawConnections(engine, state, createMemoryViews({ int32: [0, 0, 80] }));

		expect(engine.startGroup).toHaveBeenCalledWith(-5, -9);
		expect(engine.drawLine).toHaveBeenCalledWith(122, 256, 468, 480, 'wireHighlighted', 1);
		expect(engine.endGroup).toHaveBeenCalled();
	});
});
