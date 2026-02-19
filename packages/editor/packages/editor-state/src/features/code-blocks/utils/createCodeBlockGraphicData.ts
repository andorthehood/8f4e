import type { CodeBlockGraphicData } from '~/types';

export function createCodeBlockGraphicData(
	options: Partial<CodeBlockGraphicData> & { cursorY?: number } = {}
): CodeBlockGraphicData {
	const { cursorY, ...overrides } = options;

	const x = overrides.x ?? 0;
	const y = overrides.y ?? 0;
	const width = overrides.width ?? 100;
	const height = overrides.height ?? 100;
	const offsetX = overrides.offsetX ?? 0;
	const offsetY = overrides.offsetY ?? 0;
	const id = overrides.id ?? 'code-block';

	const defaultVGrid = 8;
	const defaultHGrid = 16;

	const gridX = overrides.gridX ?? Math.round(x / defaultVGrid);
	const gridY = overrides.gridY ?? Math.round(y / defaultHGrid);

	const cursorX = x + offsetX + width / 2;
	const cursorYValue = cursorY ?? height / 2;
	const cursor = overrides.cursor ?? {
		col: 0,
		row: 0,
		x: cursorX,
		y: cursorYValue,
	};

	const defaults: CodeBlockGraphicData = {
		x,
		y,
		gridX,
		gridY,
		gridWidth: overrides.gridWidth ?? 0,
		width,
		height,
		offsetX,
		offsetY,
		cursor,
		id,
		code: [],
		codeColors: [],
		codeToRender: [],
		gaps: new Map(),
		lineNumberColumnWidth: 1,
		lastUpdated: Date.now(),
		creationIndex: 0,
		blockType: 'unknown',
		disabled: false,
		isHome: false,
		extras: {
			blockHighlights: [],
			inputs: [],
			outputs: [],
			debuggers: [],
			switches: [],
			buttons: [],
			sliders: [],
			pianoKeyboards: [],
			bufferPlotters: [],
			bufferScanners: [],
			errorMessages: [],
		},
	};

	return { ...defaults, ...overrides };
}
