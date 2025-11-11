import type { CodeBlockGraphicData, EventDispatcher, State } from '../types';

/**
 * Deep partial type that makes all properties and nested properties optional
 */
type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;

/**
 * Creates a no-op function that can be used as a mock in any testing framework
 */
function createMockFunction<T extends (...args: unknown[]) => unknown>(): T {
	return (() => {}) as T;
}

/**
 * Creates a mock function that returns a resolved promise with the given value
 */
function createMockAsyncFunction<T>(returnValue: T): () => Promise<T> {
	return async () => returnValue;
}

/**
 * Helper to create a mock code block for testing with customizable properties.
 * Supports multiple calling patterns for flexibility:
 *
 * @param overridesOrIdOrX - Either a partial CodeBlockGraphicData object, an id string, or the x coordinate
 * @param yOrX - Optional: If first param is string (id), this is x; if first param is number, this is y
 * @param yOrWidth - Optional: If first param is string (id), this is y; if first param is number, this is width
 * @param width - Optional width (only used when first param is string)
 * @param height - Optional height
 * @param offsetX - Optional offsetX
 * @param offsetY - Optional offsetY
 * @param cursorY - Optional cursor Y position (relative to block)
 * @returns A complete CodeBlockGraphicData object with sensible defaults
 *
 * @example
 * // Object-based usage (recommended for complex scenarios)
 * const block = createMockCodeBlock({ id: 'my-block', x: 100, y: 200 });
 *
 * @example
 * // Positional usage with x, y
 * const block = createMockCodeBlock(100, 200); // x, y
 *
 * @example
 * // Positional usage with id, x, y
 * const block = createMockCodeBlock('my-block', 100, 200); // id, x, y
 *
 * @example
 * // Full positional with dimensions and cursor
 * const block = createMockCodeBlock('my-block', 100, 200, 150, 150, 10, 10, 75);
 */
export function createMockCodeBlock(
	overridesOrIdOrX: Partial<CodeBlockGraphicData> | string | number = {},
	yOrX?: number,
	yOrWidth?: number,
	width?: number,
	height?: number,
	offsetX?: number,
	offsetY?: number,
	cursorY?: number
): CodeBlockGraphicData {
	// Determine if we're using positional parameters or object overrides
	let overrides: Partial<CodeBlockGraphicData>;

	if (typeof overridesOrIdOrX === 'string') {
		// String id as first parameter: createMockCodeBlock('id', x, y, ...)
		const id = overridesOrIdOrX;
		const x = yOrX ?? 0;
		const y = yOrWidth ?? 0;
		const w = width ?? 100;
		const h = height ?? 100;
		const ox = offsetX ?? 0;
		const oy = offsetY ?? 0;

		overrides = {
			id,
			x,
			y,
			width: w,
			height: h,
			offsetX: ox,
			offsetY: oy,
			gridX: x,
			gridY: y,
			minGridWidth: w,
			cursor: {
				col: 0,
				row: 0,
				x: x + ox + w / 2, // Cursor X is absolute (center of block)
				y: cursorY ?? h / 2, // Cursor Y is relative to block (default to center)
			},
		};
	} else if (typeof overridesOrIdOrX === 'number') {
		// Numeric x as first parameter: createMockCodeBlock(x, y, ...)
		const x = overridesOrIdOrX;
		const y = yOrX ?? 0;
		const w = yOrWidth ?? 100;
		const h = width ?? 100;
		const ox = height ?? 0;
		const oy = offsetX ?? 0;

		overrides = {
			x,
			y,
			width: w,
			height: h,
			offsetX: ox,
			offsetY: oy,
			id: `block-${x}-${y}`,
			cursor: {
				col: 0,
				row: 0,
				x: x + ox + w / 2, // Cursor X is absolute (center of block)
				y: offsetY ?? h / 2, // Cursor Y is relative to block (default to center)
			},
		};
	} else {
		// Object override mode
		overrides = overridesOrIdOrX;
	}

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
		lastUpdated: Date.now(),
		extras: {
			blockHighlights: [],
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

/**
 * Helper to create a mock viewport for testing (GraphicHelper viewport type)
 * @param x - X coordinate (defaults to 0)
 * @param y - Y coordinate (defaults to 0)
 * @param width - Viewport width (defaults to 800)
 * @param height - Viewport height (defaults to 600)
 * @param animationDurationMs - Optional animation duration in milliseconds
 * @returns A GraphicHelper viewport object
 *
 * @example
 * const viewport = createMockViewport();
 * const viewport = createMockViewport(100, 200);
 * const viewport = createMockViewport(100, 200, 1920, 1080);
 * const viewport = createMockViewport(100, 200, 800, 600, 500);
 */
export function createMockViewport(
	x = 0,
	y = 0,
	width = 800,
	height = 600,
	animationDurationMs?: number
): State['graphicHelper']['viewport'] {
	const viewport: State['graphicHelper']['viewport'] = {
		x,
		y,
		width,
		height,
		roundedWidth: width,
		roundedHeight: height,
		vGrid: 8,
		hGrid: 16,
		borderLineCoordinates: {
			top: { startX: 0, startY: 0, endX: 0, endY: 0 },
			right: { startX: 0, startY: 0, endX: 0, endY: 0 },
			bottom: { startX: 0, startY: 0, endX: 0, endY: 0 },
			left: { startX: 0, startY: 0, endX: 0, endY: 0 },
		},
		center: { x: 0, y: 0 },
	};
	if (animationDurationMs !== undefined) {
		viewport.animationDurationMs = animationDurationMs;
	}
	return viewport;
}

/**
 * Helper to create a mock EventDispatcher for testing
 * @returns A mocked EventDispatcher with no-op functions
 *
 * @example
 * const events = createMockEventDispatcher();
 * // Can be used with any testing framework (Vitest, Jest, Playwright, etc.)
 */
export function createMockEventDispatcher(): EventDispatcher {
	return {
		on: createMockFunction(),
		off: createMockFunction(),
		dispatch: createMockFunction(),
	};
}

/**
 * Helper to create a mock State object for testing with customizable properties
 * @param overrides Optional deep partial State to override defaults (nested properties can be partially specified)
 * @returns A complete State object with sensible defaults
 *
 * @example
 * const state = createMockState();
 * const state = createMockState({ projectInfo: { title: 'My Project' } });
 * const state = createMockState({ compiler: { memoryBuffer: new Float32Array(100) } });
 */
export function createMockState(overrides: DeepPartial<State> = {}): State {
	const defaults: State = {
		projectInfo: {
			title: '',
			author: '',
			description: '',
		},
		compiler: {
			codeBuffer: new Uint8Array(0),
			isCompiling: false,
			buildErrors: [],
			compilationTime: 0,
			lastCompilationStart: 0,
			allocatedMemorySize: 0,
			memoryBuffer: new Int32Array(0),
			memoryBufferFloat: new Float32Array(0),
			compiledModules: {},
			compilerOptions: {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 1048576, // 1MB
				environmentExtensions: {
					constants: {},
					ignoredKeywords: [],
				},
			},
			cycleTime: 0,
			timerAccuracy: 0,
			binaryAssets: [],
			runtimeSettings: [
				{
					runtime: 'WebWorkerLogicRuntime',
					sampleRate: 50,
				},
			],
			selectedRuntime: 0,
		},
		callbacks: {
			requestRuntime: createMockAsyncFunction(() => () => {}),
			loadProjectFromStorage: createMockAsyncFunction(null),
		},
		graphicHelper: {
			codeBlocks: new Set(),
			viewport: {
				x: 0,
				y: 0,

				width: 1024,
				height: 768,
				roundedWidth: 1024,
				roundedHeight: 768,
				vGrid: 8,
				hGrid: 16,
				borderLineCoordinates: {
					top: { startX: 0, startY: 0, endX: 0, endY: 0 },
					right: { startX: 0, startY: 0, endX: 0, endY: 0 },
					bottom: { startX: 0, startY: 0, endX: 0, endY: 0 },
					left: { startX: 0, startY: 0, endX: 0, endY: 0 },
				},
				center: { x: 0, y: 0 },
			},
			outputsByWordAddress: new Map(),
			contextMenu: {
				highlightedItem: 0,
				itemWidth: 200,
				items: [],
				open: false,
				x: 0,
				y: 0,
				menuStack: [],
			},
			dialog: {
				show: false,
				text: '',
				title: '',
				buttons: [],
			},
			postProcessEffects: [],
		},
		midi: {
			outputs: [],
			inputs: [],
		},
		editorSettings: {
			colorScheme: 'default',
			font: '8x16',
		},
		featureFlags: {
			contextMenu: true,
			infoOverlay: true,
			moduleDragging: true,
			viewportDragging: true,
			persistentStorage: false,
			editing: true,
			viewportAnimations: true,
			demoMode: false,
		},
		colorSchemes: {},
	};

	// Deep merge overrides with defaults
	return mergeDeep(defaults, overrides);
}

/**
 * Deep merge helper for combining default state with overrides
 * @param target The target object
 * @param source The source object with overrides (can be deeply partial)
 * @returns The merged object
 */
function mergeDeep<T>(target: T, source: DeepPartial<T>): T {
	if (typeof target !== 'object' || target === null || Array.isArray(target)) {
		return target;
	}

	const result = { ...target } as T;
	const sourceObj = source as Record<string, unknown>;

	for (const key in sourceObj) {
		if (!Object.prototype.hasOwnProperty.call(sourceObj, key)) {
			continue;
		}

		const sourceValue = sourceObj[key];
		const targetKey = key as keyof T;
		const targetValue = result[targetKey];

		// Skip undefined values
		if (sourceValue === undefined) {
			continue;
		}

		// Check if we should recursively merge (both are plain objects)
		const shouldMerge =
			sourceValue !== null &&
			typeof sourceValue === 'object' &&
			!Array.isArray(sourceValue) &&
			targetValue !== null &&
			targetValue !== undefined &&
			typeof targetValue === 'object' &&
			!Array.isArray(targetValue) &&
			!(targetValue instanceof WebAssembly.Memory) &&
			!(targetValue instanceof Int32Array) &&
			!(targetValue instanceof Float32Array) &&
			!(targetValue instanceof Uint8Array) &&
			!(targetValue instanceof Map) &&
			!(targetValue instanceof Set);

		if (shouldMerge) {
			// Recursively merge nested objects
			result[targetKey] = mergeDeep(targetValue, sourceValue as DeepPartial<typeof targetValue>);
		} else {
			// Replace with source value
			result[targetKey] = sourceValue as T[keyof T];
		}
	}

	return result;
}
