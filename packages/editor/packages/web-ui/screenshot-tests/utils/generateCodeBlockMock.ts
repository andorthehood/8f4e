import { CodeBlockGraphicData } from '@8f4e/editor-state';
import { SpriteLookup } from 'glugglug';

export default function (lines: string[], x: number = 16, y: number = 16, codeColors?: (SpriteLookup | undefined)[][], id: string = ''): CodeBlockGraphicData {
	const codeToRender = lines.map(line => line.split('').map(char => char.charCodeAt(0)));
	const height = lines.length * 16;

	return {
		code: [], // Not relevant for the rendering
		codeBlocks: new Set(),
		codeColors: codeColors || new Array(lines.length).fill([]),
		codeToRender,
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
		gridX: 0, // Not relevant for the rendering
		gridY: 0, // Not relevant for the rendering
		height,
		id,
		isOpen: true,
		lastUpdated: 0,
		minGridWidth: 32,
		offsetX: 0,
		offsetY: 0,
		padLength: 1,
		positionOffsetterXWordAddress: undefined,
		positionOffsetterYWordAddress: undefined,
		trimmedCode: [], // Not relevant for the rendering
		viewport: { x: 0, y: 0 },
		width: 256,
		x,
		y,
	};
}
