import compiler from './effects/compiler';
import contextMenu from './effects/menu/contextMenu';
import loader from './effects/loader';
import midi from './effects/midi';
import moduleCreator from './effects/modules/moduleCreator';
import moduleDragger from './effects/modules/moduleDragger';
import save from './effects/save';
import viewport from './effects/viewport';
import { Options, Project, State } from './types';
import graphicHelper from './effects/graphicHelper';
import moduleOpener from './effects/modules/moduleOpener';
import _switch from './effects/modules/switch';
import button from './effects/modules/button';
import RNBO from './effects/rnbo';
import worklet from './effects/worklet';
import colorTheme from './effects/colorTheme';
import sampleRate from './effects/sampleRate';
import font from './effects/font';

import { EventDispatcher } from '../events';

const defaultState: State = {
	compiler: {
		codeBuffer: new Uint8Array(),
		compilationTime: '0',
		cycleTime: 0,
		isCompiling: false,
		lastCompilationStart: 0,
		memoryBuffer: new Int32Array(),
		memoryBufferFloat: new Float32Array(),
		memoryRef: new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }),
		timerAccuracy: 0,
		compiledModules: new Map(),
		buildErrors: [],
		compilerOptions: {
			startingMemoryWordAddress: 0,
			environmentExtensions: {
				constants: {},
				ignoredKeywords: ['debug', 'button', 'switch', 'offset', 'plot'],
			},
		},
	},
	runtime: {
		runner: 'webWorker',
		latency: 0,
		renderQuantum: 120,
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
		modules: new Set(),
		outputsByWordAddress: new Map(),
		viewport: {
			width: 0,
			height: 0,
			roundedHeight: 0,
			roundedWidth: 0,
			vGrid: 8,
			hGrid: 16,
			x: 0,
			y: 0,
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
		modules: [],
		groups: [],
		viewport: {
			x: 0,
			y: 0,
		},
		rnbo: { patchers: {} },
		sampleRate: 44100,
	},
	options: {
		isLocalStorageEnabled: true,
		isDebugMode: process.env.NODE_ENV === 'development',
		localStorageId: 'default',
		exampleProjects: {},
		exampleModules: {},
	},
	editorSettings: {
		colorScheme: 'hackerman',
		font: '8x16',
	},
};

export default function init(events: EventDispatcher, project: Project, options: Partial<Options>): State {
	const state = { ...defaultState, project, options: { ...defaultState.options, ...options } };
	midi(state, events);
	loader(state, events, defaultState);
	moduleDragger(state, events);
	moduleOpener(state, events);
	_switch(state, events);
	button(state, events);
	viewport(state, events);
	contextMenu(state, events);
	moduleCreator(state, events);
	compiler(state, events);
	graphicHelper(state, events);
	save(state, events);
	RNBO(state, events);
	worklet(state, events);
	colorTheme(state, events);
	font(state, events);
	sampleRate(state, events);
	events.dispatch('init');
	return state;
}
