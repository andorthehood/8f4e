import { Font } from '@8f4e/sprite-generator';

import { defaultFeatureFlags } from './featureFlags';

import { ConfigObject } from '~/types';

export const defaultConfig: ConfigObject = {
	runtimeSettings: {
		runtime: 'WebWorkerLogicRuntime',
		sampleRate: 50,
	},
	memorySizeBytes: 1048576,
	disableAutoCompilation: false,
	binaryAssets: [],
};

export default function createDefaultState() {
	return {
		compiler: {
			compilationTime: 0,
			isCompiling: false,
			lastCompilationStart: 0,
			allocatedMemorySize: 0,
			compiledModules: {},
			byteCodeSize: 0,
			hasMemoryBeenReinitialized: false,
		},
		midi: {
			inputs: [],
			outputs: [],
		},
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
			selectedCodeBlockForProgrammaticEdit: undefined,
			postProcessEffects: [],
		},
		editorSettings: {
			colorScheme: 'hackerman',
			font: '8x16' as Font,
		},
		featureFlags: defaultFeatureFlags,
		colorSchemes: [],
		historyStack: [],
		redoStack: [],
		storageQuota: { usedBytes: 0, totalBytes: 0 },
		binaryAssets: [],
		codeErrors: {
			compilationErrors: [],
			configErrors: [],
		},
		console: {
			logs: [],
			maxLogs: 100,
		},
		compiledConfig: defaultConfig,
		runtime: {
			stats: {
				timeToExecuteLoopMs: 0,
				timerPrecisionPercentage: 0,
				timerDriftMs: 0,
				timerExpectedIntervalTimeMs: 0,
			},
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
			animationDurationMs: 0,
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
	};
}
