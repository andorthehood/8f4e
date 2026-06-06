import type { CodeBlockGraphicData, EventDispatcher, State, Viewport } from '@8f4e/editor-state-types';

type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;

function createMockFunction<T extends (...args: unknown[]) => unknown>(): T {
	return (() => {}) as T;
}

function createMockAsyncFunction<T>(returnValue: T): () => Promise<T> {
	return async () => returnValue;
}

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
	const code = overrides.code ?? [];
	const name = overrides.name ?? code[0]?.trim().split(/\s+/)[1] ?? 'test-block';
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
		width,
		height,
		offsetX,
		offsetY,
		cursor,
		name,
		code,
		codeColors: [],
		codeToRender: [],
		gaps: new Map(),
		lineNumberColumnWidth: 1,
		lastUpdated: Date.now(),
		textureCacheKey: '',
		isCollapsed: false,
		creationIndex: 0,
		blockType: 'unknown',
		disabled: false,
		hidden: false,
		isHome: false,
		isFavorite: false,
		opacity: 1,
		alwaysOnTop: false,
		parsedDirectives: [],
		widgets: {
			blockHighlights: [],
			inputs: [],
			outputs: [],
			debuggers: [],
			switches: [],
			buttons: [],
			sliders: [],
			crossfades: [],
			pianoKeyboards: [],
			arrayPlotters: [],
			arrayBars: [],
			arrayMeters: [],
			arrayWaves: [],
			infoPanels: [],
			errorMessages: [],
		},
	};

	return { ...defaults, ...overrides };
}

export function createMockViewport(x = 0, y = 0, width = 800, height = 600): Viewport {
	return {
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
}

export function createMockEventDispatcher(): EventDispatcher {
	return {
		on: createMockFunction(),
		off: createMockFunction(),
		dispatch: createMockFunction(),
	};
}

export function createMockState(overrides: DeepPartial<State> = {}): State {
	const mockRuntimeFactory = () => () => {};
	const workerRuntimeDefaults = { sampleRate: 50 } as const;

	const defaults: State = {
		compiler: {
			isCompiling: false,
			compiledModules: {},
		},
		callbacks: {
			loadSession: createMockAsyncFunction(null),
		},
		runtimeRegistry: {
			WebWorkerRuntime: {
				id: 'WebWorkerRuntime',
				editorConfigSchema: {
					root: 'workerRuntime',
					defaults: workerRuntimeDefaults,
					schema: { type: 'object', properties: {} },
				},
				factory: mockRuntimeFactory,
			},
		},
		codeBlockRendering: {
			codeBlocks: [],
			entryOutlines: [],
			viewportAnchoredCodeBlocks: [],
			textureCacheEpoch: 0,
			nextCodeBlockCreationIndex: 0,
			outputsByWordAddress: new Map(),
			showHiddenCodeBlocks: false,
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
		postProcessEffects: [],
		backgroundEffects: [],
		info: {
			compiler: {
				isCompiling: false,
				compilationTimeMs: 0,
				wasmByteCodeBytes: 0,
				requiredMemoryBytes: 0,
				allocatedMemoryBytes: 0,
				allocatedPages: 0,
				memoryUsagePercent: 0,
				astCacheHits: 0,
				astCacheMisses: 0,
				memoryReinitialized: false,
			},
		},
		tooltip: {
			text: [],
			characters: [],
			colors: [],
			lineCount: 0,
			widthChars: 0,
			layout: {
				horizontalPadding: 0,
				width: 0,
				height: 0,
				x: 0,
				y: 0,
				lineX: 0,
			},
			highlights: [],
			liveValues: [],
		},
		featureFlags: {
			contextMenu: true,
			infoOverlay: true,
			moduleDragging: true,
			codeLineSelection: true,
			viewportDragging: true,
			editing: true,
			modeToggling: true,
			modeOverlay: true,
			consoleOverlay: false,
			positionOffsetters: true,
			offscreenBlockArrows: true,
		},
		editorMode: 'edit',
		editorConfig: {},
		editorConfigValidators: {},
		editorConfigSchemaContributions: {},
		historyStack: [],
		redoStack: [],
		storageQuota: { usedBytes: 0, totalBytes: 0 },
		binaryAssets: [],
		codeErrors: {
			compilationErrors: [],
			editorDirectiveErrors: [],
			shaderErrors: [],
		},
		console: {
			logs: [],
			maxLogs: 100,
		},
		runtime: {
			values: {},
		},
		globalEditorDirectives: {},
		dialog: {
			id: '',
			text: '',
			wrappedText: [''],
			title: '',
			buttons: [],
			width: 0,
			height: 0,
			x: 0,
			y: 0,
		},
		dialogStack: [],
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
		viewportAnimation: {
			startX: 0,
			startY: 0,
			targetX: 0,
			targetY: 0,
			active: false,
			durationMs: 500,
		},
		presentation: {
			canPresent: false,
			activeStopIndex: 0,
			totalStops: 0,
			remainingMs: 0,
			currentStopDurationMs: 0,
			deadlineAt: undefined,
		},
	};

	return mergeDeep(defaults, overrides);
}

function mergeDeep<T>(target: T, source: DeepPartial<T>): T {
	if (typeof target !== 'object' || target === null || Array.isArray(target)) {
		return target;
	}

	const result = { ...target } as T;
	const sourceObj = source as Record<string, unknown>;

	for (const key in sourceObj) {
		if (!Object.hasOwn(sourceObj, key)) {
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
