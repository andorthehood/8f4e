import type { CodeBlockGraphicData } from '../types';

/**
 * Helper to create a mock code block for testing with customizable properties
 * @param overrides Optional partial CodeBlockGraphicData to override defaults
 * @returns A complete CodeBlockGraphicData object with sensible defaults
 */
export function createMockCodeBlock(overrides: Partial<CodeBlockGraphicData> = {}): CodeBlockGraphicData {
	const defaults: CodeBlockGraphicData = {
		x: 0,
		y: 0,
		width: 100,
		height: 100,
		offsetX: 0,
		offsetY: 0,
		code: [],
		trimmedCode: [],
		codeColors: [],
		codeToRender: [],
		cursor: { col: 0, row: 0, x: 0, y: 0 },
		id: 'test-block',
		gaps: new Map(),
		gridX: 0,
		gridY: 0,
		padLength: 1,
		minGridWidth: 32,
		viewport: { x: 0, y: 0 },
		codeBlocks: new Set(),
		lastUpdated: Date.now(),
		extras: {
			inputs: new Map(),
			outputs: new Map(),
			debuggers: new Map(),
			switches: new Map(),
			buttons: new Map(),
			pianoKeyboards: new Map(),
			bufferPlotters: new Map(),
			errorMessages: new Map(),
		},
	};

	return { ...defaults, ...overrides };
}
