import { Font } from '@8f4e/sprite-generator';
import createStateManager, { StateManager } from '@8f4e/state-manager';

import _switch from './effects/codeBlocks/extras/switches/interaction';
import button from './effects/codeBlocks/extras/buttons/interaction';
import codeBlockCreator from './effects/codeBlocks/codeBlockCreator';
import codeBlockDragger from './effects/codeBlocks/codeBlockDragger';
import codeBlockOpener from './effects/codeBlocks/codeBlockOpener';
import compiler from './effects/compiler';
import contextMenu from './effects/menu/contextMenu';
import font from './effects/font';
import graphicHelper from './effects/codeBlocks/graphicHelper';
import loader from './effects/loader';
import pianoKeyboard from './effects/codeBlocks/extras/pianoKeyboard/interaction';
import sampleRate from './effects/sampleRate';
import save from './effects/save';
import exportWasm from './effects/exportWasm';
import viewport from './effects/viewport';
import binaryAsset from './effects/binaryAssets';
import runtime from './effects/runtime';

import { validateFeatureFlags, defaultFeatureFlags } from '../config/featureFlags';
import { EventDispatcher } from '../events';

import type { Options, Project, State, CodeBlockGraphicData } from './types';

// Helper function to create base code block with self-reference
function createBaseCodeBlock(): CodeBlockGraphicData {
	const baseCodeBlock: Omit<CodeBlockGraphicData, 'parent'> & { parent?: CodeBlockGraphicData } = {
		width: 0,
		minGridWidth: 32,
		height: 0,
		code: [],
		trimmedCode: [],
		codeColors: [],
		codeToRender: [],
		cursor: { col: 0, row: 0, x: 0, y: 0 },
		id: '',
		gaps: new Map(),
		x: 0,
		y: 0,
		offsetX: 0,
		offsetY: 0,
		gridX: 0,
		gridY: 0,
		isOpen: true,
		padLength: 1,
		viewport: {
			x: 0,
			y: 0,
		},
		codeBlocks: new Set<CodeBlockGraphicData>(),
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
		lastUpdated: Date.now(),
	};

	// Set self-reference for parent
	const result = baseCodeBlock as CodeBlockGraphicData;
	result.parent = result;
	return result;
}

// Helper function to create graphic helper with proper references
function createGraphicHelper() {
	const baseCodeBlock = createBaseCodeBlock();
	return {
		dialog: {
			show: false,
			text: 'Lorem ipsum dolor sit amet',
			title: 'Dialog',
			buttons: [{ title: 'Close', action: 'close' }],
		},
		baseCodeBlock,
		activeViewport: baseCodeBlock,
		outputsByWordAddress: new Map(),
		globalViewport: {
			width: 0,
			height: 0,
			roundedHeight: 0,
			roundedWidth: 0,
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
	};
}

const maxMemorySize = 10000;
const initialMemorySize = 1000;

// Default state without the runtime callback (will be merged with provided options)
const defaultStateBase = {
	compiler: {
		codeBuffer: new Uint8Array(),
		compilationTime: 0,
		cycleTime: 0,
		isCompiling: false,
		lastCompilationStart: 0,
		allocatedMemorySize: 0,
		memoryBuffer: new Int32Array(),
		memoryBufferFloat: new Float32Array(),
		memoryRef: new WebAssembly.Memory({ initial: initialMemorySize, maximum: maxMemorySize, shared: true }),
		timerAccuracy: 0,
		compiledModules: {},
		buildErrors: [],
		compilerOptions: {
			initialMemorySize,
			maxMemorySize,
			startingMemoryWordAddress: 0,
			environmentExtensions: {
				constants: {},
				ignoredKeywords: ['debug', 'button', 'switch', 'offset', 'plot', 'piano'],
			},
		},
	},
	midi: {
		inputs: [],
		outputs: [],
	},
	graphicHelper: createGraphicHelper(),
	editorSettings: {
		colorScheme: 'hackerman',
		font: '8x16' as Font,
	},
	featureFlags: defaultFeatureFlags,
	compilationTime: 0,
	colorSchemes: {},
};

export default function init(events: EventDispatcher, project: Project, options: Options): StateManager<State> {
	// Initialize feature flags
	const featureFlags = validateFeatureFlags(options.featureFlags);

	const store = createStateManager<State>({
		...defaultStateBase,
		project,
		callbacks: options.callbacks,
		featureFlags,
	});

	const state = store.getState();

	runtime(state, events);
	sampleRate(state, events);
	loader(store, events, state);
	codeBlockDragger(state, events);
	codeBlockOpener(state, events);
	_switch(state, events);
	button(state, events);
	pianoKeyboard(state, events);
	viewport(state, events);
	contextMenu(store, events);
	codeBlockCreator(state, events);
	compiler(state, events);
	graphicHelper(state, events);
	save(state, events);
	exportWasm(state, events);
	font(state, events);
	binaryAsset(state, events);
	events.dispatch('init');
	return store;
}
