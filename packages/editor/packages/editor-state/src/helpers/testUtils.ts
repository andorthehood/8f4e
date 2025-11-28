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
 * All parameters are specified via an options object.
 *
 * @param options - Optional configuration object with any CodeBlockGraphicData properties plus cursorY convenience parameter
 * @param options.cursorY - Optional convenience parameter to set cursor.y (relative to block)
 * @returns A complete CodeBlockGraphicData object with sensible defaults
 *
 * @example
 * // Basic usage with defaults
 * const block = createMockCodeBlock();
 *
 * @example
 * // Specify position and dimensions
 * const block = createMockCodeBlock({ x: 100, y: 200, width: 150, height: 150 });
 *
 * @example
 * // Use cursorY convenience parameter
 * const block = createMockCodeBlock({ id: 'my-block', x: 100, y: 200, cursorY: 75 });
 *
 * @example
 * // Override any property
 * const block = createMockCodeBlock({ id: 'custom', code: ['test'], offsetX: 10, offsetY: 10 });
 */
export function createMockCodeBlock(
	options: Partial<CodeBlockGraphicData> & { cursorY?: number } = {}
): CodeBlockGraphicData {
	// Extract cursorY if provided (not part of CodeBlockGraphicData)
	const { cursorY, ...overrides } = options;

	// Set defaults for commonly used properties
	const x = overrides.x ?? 0;
	const y = overrides.y ?? 0;
	const width = overrides.width ?? 100;
	const height = overrides.height ?? 100;
	const offsetX = overrides.offsetX ?? 0;
	const offsetY = overrides.offsetY ?? 0;
	const id = overrides.id ?? 'test-block';

	// Compute derived defaults
	const minGridWidth = overrides.minGridWidth ?? width;

	// Compute cursor defaults only if cursor is not explicitly overridden
	const cursorX = x + offsetX + width / 2; // Cursor X is absolute (center of block)
	const cursorYValue = cursorY ?? height / 2; // Cursor Y is relative to block (default to center)
	const cursor = overrides.cursor ?? {
		col: 0,
		row: 0,
		x: cursorX,
		y: cursorYValue,
	};

	const defaults: CodeBlockGraphicData = {
		x,
		y,
		width,
		height,
		offsetX,
		offsetY,
		minGridWidth,
		cursor,
		id,
		code: [],
		codeColors: [],
		codeToRender: [],
		gaps: new Map(),
		lineNumberColumnWidth: 1,
		lastUpdated: Date.now(),
		extras: {
			blockHighlights: [],
			inputs: [],
			outputs: [],
			debuggers: [],
			switches: [],
			buttons: [],
			pianoKeyboards: [],
			bufferPlotters: [],
			errorMessages: [],
		},
	};

	return { ...defaults, ...overrides };
}

/**
 * Helper to find an item by id in an extras array
 * Useful for test assertions on array-based extras
 *
 * @param array - The extras array to search
 * @param id - The id to find
 * @returns The item with the matching id, or undefined if not found
 *
 * @example
 * const button = findExtrasById(mockGraphicData.extras.buttons, 'btn1');
 * expect(button).toBeDefined();
 */
export function findExtrasById<T extends { id: string }>(array: T[], id: string): T | undefined {
	return array.find(item => item.id === id);
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
			loadSession: createMockAsyncFunction(null),
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
		colorSchemes: [],
		historyStack: [],
		redoStack: [],
		storageQuota: { usedBytes: 0, totalBytes: 0 },
		binaryAssets: [],
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
