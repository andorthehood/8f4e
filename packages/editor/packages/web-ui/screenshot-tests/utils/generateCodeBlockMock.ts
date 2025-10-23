import { CodeBlockGraphicData } from '@8f4e/editor-state';

export default function () {
	return new Set<CodeBlockGraphicData>([
		{
			code: ['module test', '', '; Hello world', '', 'moduleEnd'],
			codeBlocks: new Set(),
			codeColors: [[], [], [], [], []],
			codeToRender: [
				[48, 32, 109, 111, 100, 117, 108, 101, 32, 116, 101, 115, 116],
				[49, 32],
				[50, 32, 59, 32, 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100],
				[51, 32],
				[52, 32, 109, 111, 100, 117, 108, 101, 69, 110, 100],
			],
			cursor: { x: 112, y: 0, row: 0, col: 11 },
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
			gaps: new Map(),
			gridX: -32,
			gridY: -11,
			height: 80,
			id: 'test',
			isOpen: true,
			lastUpdated: 0,
			minGridWidth: 32,
			offsetX: 0,
			offsetY: 0,
			padLength: 1,
			positionOffsetterXWordAddress: undefined,
			positionOffsetterYWordAddress: undefined,
			trimmedCode: ['module test', '', '; Hello world', '', 'moduleEnd'],
			viewport: { x: 0, y: 0 },
			width: 256,
			x: -256,
			y: -176,
		},
	]);
}
