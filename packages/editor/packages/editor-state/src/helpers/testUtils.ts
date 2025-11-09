import type { CodeBlockGraphicData, Viewport, EventDispatcher, State } from '../types';

/**
 * Creates a no-op function that can be used as a mock in any testing framework
 */
function createMockFunction<T extends (...args: any[]) => any>(): T {
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

/**
 * Helper to create a mock viewport for testing
 * @param x - X coordinate (defaults to 0)
 * @param y - Y coordinate (defaults to 0)
 * @param animationDurationMs - Optional animation duration in milliseconds
 * @returns A Viewport object
 *
 * @example
 * const viewport = createMockViewport();
 * const viewport = createMockViewport(100, 200);
 * const viewport = createMockViewport(100, 200, 500);
 */
export function createMockViewport(x = 0, y = 0, animationDurationMs?: number): Viewport {
	const viewport: Viewport = { x, y };
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
 * @param overrides Optional partial State to override defaults
 * @returns A complete State object with sensible defaults
 *
 * @example
 * const state = createMockState();
 * const state = createMockState({ projectInfo: { title: 'My Project' } });
 */
export function createMockState(overrides: Partial<State> = {}): State {
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
			loadColorSchemes: createMockAsyncFunction({
				default: { text: {}, fill: {}, icons: {} },
			}),
		},
		graphicHelper: {
			activeViewport: {
				codeBlocks: new Set(),
				viewport: { x: 0, y: 0 },
			} as CodeBlockGraphicData,
			outputsByWordAddress: new Map(),
			globalViewport: {
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
		compilationTime: 0,
		colorSchemes: {},
	};

	// Deep merge overrides with defaults
	return mergeDeep(defaults, overrides) as State;
}

/**
 * Deep merge helper for combining default state with overrides
 * @param target The target object
 * @param source The source object with overrides
 * @returns The merged object
 */
function mergeDeep<T>(target: T, source: Partial<T>): T {
	const result = { ...target };

	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			const sourceValue = source[key];
			const targetValue = result[key];

			if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && targetValue) {
				// For objects (but not arrays), recursively merge
				if (
					typeof targetValue === 'object' &&
					!Array.isArray(targetValue) &&
					!(targetValue instanceof WebAssembly.Memory) &&
					!(targetValue instanceof Int32Array) &&
					!(targetValue instanceof Float32Array) &&
					!(targetValue instanceof Uint8Array) &&
					!(targetValue instanceof Map) &&
					!(targetValue instanceof Set)
				) {
					result[key] = mergeDeep(targetValue, sourceValue as Partial<typeof targetValue>);
				} else {
					// For special types, just replace
					result[key] = sourceValue as T[Extract<keyof T, string>];
				}
			} else {
				// For primitives, arrays, and other types, just replace
				result[key] = sourceValue as T[Extract<keyof T, string>];
			}
		}
	}

	return result;
}
