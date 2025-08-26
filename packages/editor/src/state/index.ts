import { Options, Project, State } from './types';
import _switch from './effects/codeBlocks/extras/switches/interaction';
import button from './effects/codeBlocks/extras/buttons/interaction';
import codeBlockCreator from './effects/codeBlocks/codeBlockCreator';
import codeBlockDragger from './effects/codeBlocks/codeBlockDragger';
import codeBlockOpener from './effects/codeBlocks/codeBlockOpener';
import colorTheme from './effects/colorTheme';
import compiler from './effects/compiler';
import contextMenu from './effects/menu/contextMenu';
import font from './effects/font';
import graphicHelper from './effects/codeBlocks/graphicHelper';
import loader from './effects/loader';
import nestedCodeBlocksOpener from './effects/codeBlocks/nestedCodeBlocksOpener';
import pianoKeyboard from './effects/codeBlocks/extras/pianoKeyboard/interaction';
import sampleRate from './effects/sampleRate';
import save from './effects/save';
import viewport from './effects/viewport';
import binaryAsset from './effects/binaryAssets';
import runtime from './effects/runtime';

import { validateFeatureFlags, defaultFeatureFlags } from '../config/featureFlags';
import { EventDispatcher } from '../events';

const maxMemorySize = 10000;
const initialMemorySize = 1000;

const defaultState: State = {
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
		compiledModules: new Map(),
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
	graphicHelper: {
		dialog: {
			show: false,
			text: 'Lorem ipsum dolor sit amet',
			title: 'Dialog',
			buttons: [{ title: 'Close', action: 'close' }],
		},
		baseCodeBlock: {
			width: 0,
			minGridWidth: 32,
			height: 0,
			code: [],
			trimmedCode: [],
			codeColors: [],
			codeToRender: [],
			// @ts-ignore
			inputs: new Map(),
			outputs: new Map(),
			debuggers: new Map(),
			switches: new Map(),
			buttons: new Map(),
			pianoKeyboards: new Map(),
			bufferPlotters: new Map(),
			cursor: { col: 0, row: 0, x: 0, y: 0 },
			id: '',
			gaps: new Map(),
			errorMessages: new Map(),
			x: 0,
			y: 0,
			offsetX: 0,
			offsetY: 0,
			gridX: 0,
			gridY: 0,
			isOpen: true,
			padLength: 1,
			// @ts-ignore
			parent: undefined,
			viewport: {
				x: 0,
				y: 0,
			},
			codeBlocks: new Set(),
		},
		// @ts-ignore
		activeViewport: undefined,
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
	},
	project: {
		title: '',
		author: '',
		description: '',
		codeBlocks: [],
		viewport: {
			x: 0,
			y: 0,
		},
		selectedRuntime: 0,
		runtimeSettings: [
			{
				sampleRate: 50,
				runtime: 'WebWorkerLogicRuntime',
			},
		],
		binaryAssets: [],
	},
	options: {
		localStorageId: 'default',
		exampleProjects: {},
		exampleModules: {},
	},
	editorSettings: {
		colorScheme: 'hackerman',
		font: '8x16',
	},
	featureFlags: defaultFeatureFlags,
};

defaultState.graphicHelper.activeViewport = defaultState.graphicHelper.baseCodeBlock;
defaultState.graphicHelper.baseCodeBlock.parent = defaultState.graphicHelper.baseCodeBlock;

export default function init(events: EventDispatcher, project: Project, options: Partial<Options>): State {
	// Initialize feature flags
	const featureFlags = validateFeatureFlags(options.featureFlags);

	const state = {
		...defaultState,
		project,
		options: { ...defaultState.options, ...options },
		featureFlags,
	};

	runtime(state, events);
	sampleRate(state, events);
	loader(state, events, defaultState);
	codeBlockDragger(state, events);
	codeBlockOpener(state, events);
	nestedCodeBlocksOpener(state, events);
	_switch(state, events);
	button(state, events);
	pianoKeyboard(state, events);
	viewport(state, events);
	contextMenu(state, events);
	codeBlockCreator(state, events);
	compiler(state, events);
	graphicHelper(state, events);
	save(state, events);
	colorTheme(state, events);
	font(state, events);
	binaryAsset(state, events);
	events.dispatch('init');
	return state;
}
