import type { CodeBlockGraphicData, EventDispatcher, State } from '~/types';

import { Viewport } from '~/features/viewport/types';

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
 * @remarks
 * **Cursor Coordinate System:**
 * - `cursor.x` is absolute (computed as block center: x + offsetX + width/2)
 * - `cursor.y` is relative to the block (defaults to height/2, i.e., center of block)
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
	const { cursorY, ...overrides } = options;

	const x = overrides.x ?? 0;
	const y = overrides.y ?? 0;
	const width = overrides.width ?? 100;
	const height = overrides.height ?? 100;
	const offsetX = overrides.offsetX ?? 0;
	const offsetY = overrides.offsetY ?? 0;
	const id = overrides.id ?? 'test-block';

	// Default grid size for testing (matches common font sizes)
	const defaultVGrid = 8;
	const defaultHGrid = 16;

	// If gridX/gridY are provided, use them. Otherwise compute from x/y
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
		gridHeight: overrides.gridHeight ?? 0,
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
export function createMockViewport(x = 0, y = 0, width = 800, height = 600, animationDurationMs?: number): Viewport {
	const viewport: Viewport = {
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
 * const state = createMockState({ compiler: { compilationTime: 123 } });
 * const state = createMockState({ callbacks: { setWordInMemory: () => {} } });
 */
export function createMockState(overrides: DeepPartial<State> = {}): State {
	const mockRuntimeFactory = () => () => {};

	const defaults: State = {
		compiler: {
			isCompiling: false,
			compilationTime: 0,
			lastCompilationStart: 0,
			allocatedMemorySize: 0,
			compiledModules: {},
			byteCodeSize: 0,
			hasMemoryBeenReinitialized: false,
		},
		callbacks: {
			loadSession: createMockAsyncFunction(null),
		},
		runtimeRegistry: {
			WebWorkerLogicRuntime: {
				id: 'WebWorkerLogicRuntime',
				defaults: { runtime: 'WebWorkerLogicRuntime', sampleRate: 50 },
				schema: { type: 'object', properties: {} },
				factory: mockRuntimeFactory,
			},
		},
		defaultRuntimeId: 'WebWorkerLogicRuntime',
		graphicHelper: {
			codeBlocks: [],
			nextCodeBlockCreationIndex: 0,
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
			postProcessEffects: [],
			backgroundEffects: [],
		},
		midi: {
			outputs: [],
			inputs: [],
		},
		featureFlags: {
			contextMenu: true,
			infoOverlay: true,
			moduleDragging: true,
			viewportDragging: true,
			editing: true,
			viewportAnimations: true,
			demoMode: false,
			consoleOverlay: false,
			positionOffsetters: true,
		},
		colorSchemes: [],
		historyStack: [],
		redoStack: [],
		storageQuota: { usedBytes: 0, totalBytes: 0 },
		binaryAssets: [],
		codeErrors: {
			compilationErrors: [],
			projectConfigErrors: [],
			editorConfigErrors: [],
			shaderErrors: [],
		},
		console: {
			logs: [],
			maxLogs: 100,
		},
		runtime: {
			stats: {
				timeToExecuteLoopMs: 0,
				timerPrecisionPercentage: 0,
				timerDriftMs: 0,
				timerExpectedIntervalTimeMs: 0,
			},
		},
		compiledProjectConfig: {
			runtimeSettings: {
				runtime: 'WebWorkerLogicRuntime',
				sampleRate: 50,
			},
			memorySizeBytes: 1048576,
			disableAutoCompilation: false,
			binaryAssets: [],
		},
		compiledEditorConfig: {
			font: '8x16',
			colorScheme: 'hackerman',
		},
		dialog: {
			show: false,
			text: '',
			wrappedText: [''],
			title: '',
			buttons: [],
			width: 0,
			height: 0,
			x: 0,
			y: 0,
		},
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
	};

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

		if (sourceValue === undefined) {
			continue;
		}

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
			result[targetKey] = mergeDeep(targetValue, sourceValue as DeepPartial<typeof targetValue>);
		} else {
			result[targetKey] = sourceValue as T[keyof T];
		}
	}

	return result;
}
