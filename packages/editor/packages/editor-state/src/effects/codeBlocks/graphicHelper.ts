import { StateManager } from '@8f4e/state-manager';

import bufferPlotters from './codeBlockDecorators/bufferPlotters/updateGraphicData';
import buttons from './codeBlockDecorators/buttons/updateGraphicData';
import debuggers from './codeBlockDecorators/debuggers/updateGraphicData';
import errorMessages from './codeBlockDecorators/errorMessages/errorMessages';
import gaps from './gaps';
import inputs from './codeBlockDecorators/inputs/updateGraphicData';
import outputs from './codeBlockDecorators/outputs/updateGraphicData';
import pianoKeyboards from './codeBlockDecorators/pianoKeyboard/updateGraphicData';
import positionOffsetters from './positionOffsetters';
import switches from './codeBlockDecorators/switches/updateGraphicData';
import blockHighlights from './codeBlockDecorators/blockHighlights/updateGraphicData';
import { CodeBlockClickEvent } from './codeBlockDragger';
import { CodeBlockAddedEvent } from './codeBlockCreator';

import { EventDispatcher } from '../../types';
import { gapCalculator } from '../../pureHelpers/codeEditing/gapCalculator';
import { generateCodeColorMap } from '../../pureHelpers/codeEditing/generateCodeColorMap';
import { moveCaret } from '../../pureHelpers/codeEditing/moveCaret';
import { reverseGapCalculator } from '../../pureHelpers/codeEditing/reverseGapCalculator';
import getLongestLineLength from '../../pureHelpers/codeParsers/getLongestLineLength';
import getModuleId from '../../pureHelpers/codeParsers/getModuleId';

import type { CodeBlockGraphicData, State } from '../../types';

const instructionsToHighlight = [
	'and',
	'or',
	'const',
	'load',
	'load8u',
	'load16u',
	'load8s',
	'load16s',
	'localGet',
	'localSet',
	'else',
	'if',
	'ifEnd',
	'lessThan',
	'store',
	'sub',
	'div',
	'xor',
	'local',
	'greaterOrEqual',
	'add',
	'greaterThan',
	'branch',
	'branchIfTrue',
	'push',
	'block',
	'blockEnd',
	'lessOrEqual',
	'mul',
	'loop',
	'loopEnd',
	'greaterOrEqualUnsigned',
	'equalToZero',
	'shiftLeft',
	'shiftRight',
	'shiftRightUnsigned',
	'remainder',
	'module',
	'moduleEnd',
	'config',
	'configEnd',
	'set',
	'scope',
	'rescope',
	'rescopeTop',
	'popScope',
	'int',
	'float',
	'int*',
	'int**',
	'float*',
	'float**',
	'float[]',
	'int[]',
	'int8[]',
	'int16[]',
	'int32[]',
	'float*[]',
	'float**[]',
	'int*[]',
	'int**[]',
	'castToInt',
	'castToFloat',
	'skip',
	'drop',
	'clearStack',
	'risingEdge',
	'fallingEdge',
	'dup',
	'swap',
	'cycle',
	'abs',
	'use',
	'equal',
	'wasm',
	'branchIfUnchanged',
	'init',
	'pow2',
	'sqrt',
	'loadFloat',
	'round',
	'ensureNonZero',
	'function',
	'functionEnd',
	'initBlock',
	'initBlockEnd',
	'concat',
];

export default function graphicHelper(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	const onCodeBlockClick = function ({ relativeX = 0, relativeY = 0, codeBlock }: CodeBlockClickEvent) {
		const [row, col] = moveCaret(
			codeBlock.code,
			reverseGapCalculator(Math.floor(relativeY / state.graphicHelper.viewport.hGrid), codeBlock.gaps),
			Math.floor(relativeX / state.graphicHelper.viewport.vGrid) - (codeBlock.lineNumberColumnWidth + 2),
			'Jump'
		);
		codeBlock.cursor.row = row;
		codeBlock.cursor.col = col;
	};

	const updateGraphics = function (graphicData: CodeBlockGraphicData) {
		if (!state.graphicHelper.spriteLookups) {
			return;
		}

		graphicData.lineNumberColumnWidth = graphicData.code.length.toString().length;

		const codeWithLineNumbers = graphicData.code.map(
			(line, index) => `${index}`.padStart(graphicData.lineNumberColumnWidth, '0') + ' ' + line
		);

		graphicData.codeToRender = codeWithLineNumbers.map(line => line.split('').map(char => char.charCodeAt(0)));

		graphicData.codeColors = generateCodeColorMap(codeWithLineNumbers, state.graphicHelper.spriteLookups, [
			...instructionsToHighlight,
			...state.compiler.compilerOptions.environmentExtensions.ignoredKeywords,
		]);

		gaps(graphicData);
		pianoKeyboards(graphicData, state);

		graphicData.width =
			Math.max(graphicData.minGridWidth, getLongestLineLength(codeWithLineNumbers) + 4) *
			state.graphicHelper.viewport.vGrid;

		// errorMessages(graphicData, state);
		bufferPlotters(graphicData, state);
		outputs(graphicData, state);
		inputs(graphicData, state);
		debuggers(graphicData, state);
		switches(graphicData, state);
		buttons(graphicData, state);
		positionOffsetters(graphicData, state);
		blockHighlights(graphicData, state);

		graphicData.height = graphicData.codeToRender.length * state.graphicHelper.viewport.hGrid;
		graphicData.cursor.x =
			(graphicData.cursor.col + (graphicData.lineNumberColumnWidth + 2)) * state.graphicHelper.viewport.vGrid;
		graphicData.cursor.y = gapCalculator(graphicData.cursor.row, graphicData.gaps) * state.graphicHelper.viewport.hGrid;
		graphicData.id = getModuleId(graphicData.code) || '';
	};

	const updateGraphicsAll = function () {
		for (const graphicData of state.graphicHelper.codeBlocks) {
			updateGraphics(graphicData);
		}
	};

	const updateSelectedCodeBlock = function () {
		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}
		updateGraphics(state.graphicHelper.selectedCodeBlock);
	};

	errorMessages(store);

	events.on<CodeBlockClickEvent>('codeBlockClick', onCodeBlockClick);
	events.on<CodeBlockClickEvent>('codeBlockClick', ({ codeBlock }) => updateGraphics(codeBlock));
	events.on('runtimeInitialized', updateGraphicsAll);
	events.on<CodeBlockAddedEvent>('codeBlockAdded', ({ codeBlock }) => updateGraphics(codeBlock));
	events.on('init', updateGraphicsAll);
	events.on('spriteSheetRerendered', updateGraphicsAll);
	store.subscribe('graphicHelper.codeBlocks', updateGraphicsAll);
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateSelectedCodeBlock);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor', updateSelectedCodeBlock);
}
