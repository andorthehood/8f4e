import { Font } from '@8f4e/sprite-generator';

import { defaultFeatureFlags } from './featureFlags';

import type { CodeBlockGraphicData } from '../../types';

export default function createDefaultState() {
	return {
		projectInfo: {
			title: '',
			author: '',
			description: '',
		},
		compiler: {
			codeBuffer: new Uint8Array(),
			compilationTime: 0,
			isCompiling: false,
			lastCompilationStart: 0,
			allocatedMemorySize: 0,
			memoryBuffer: new Int32Array(),
			memoryBufferFloat: new Float32Array(),
			compiledModules: {},
			compilerOptions: {
				memorySizeBytes: 1048576, // 1MB default
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
			codeBlocks: new Set<CodeBlockGraphicData>(),
			nextCodeBlockCreationIndex: 0,
			outputsByWordAddress: new Map(),
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
		runtime: {
			runtimeSettings: [
				{
					runtime: 'WebWorkerLogicRuntime' as const,
					sampleRate: 50,
				},
			],
			selectedRuntime: 0,
			stats: {
				timeToExecuteLoopMs: 0,
				timerPrecisionPercentage: 0,
				timerDriftMs: 0,
				timerExpectedIntervalTimeMs: 0,
			},
		},
	};
}
