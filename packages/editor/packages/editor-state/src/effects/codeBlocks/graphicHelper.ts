import { StateManager } from '@8f4e/state-manager';

import bufferPlotters from './extras/bufferPlotters/codeParser';
import buttons from './extras/buttons/codeParser';
import debuggers from './extras/debuggers/codeParser';
import errorMessages from './extras/errorMessages/errorMessages';
import gaps from './gaps';
import inputs from './extras/inputs/codeParser';
import outputs from './extras/outputs/codeParser';
import pianoKeyboards from './extras/pianoKeyboard/codeParser';
import positionOffsetters from './positionOffsetters';
import switches from './extras/switches/codeParser';
import { CodeBlockClickEvent } from './codeBlockDragger';
import { CodeBlockAddedEvent } from './codeBlockCreator';

import { EventDispatcher } from '../../types';
import { gapCalculator, generateCodeColorMap, moveCaret, reverseGapCalculator } from '../../helpers/editor';
import { getLongestLineLength, getModuleId } from '../../helpers/codeParsers';

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
];

export default function graphicHelper(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	const onCodeBlockClick = function ({ relativeX = 0, relativeY = 0, codeBlock }: CodeBlockClickEvent) {
		const [row, col] = moveCaret(
			codeBlock.code,
			reverseGapCalculator(Math.floor(relativeY / state.graphicHelper.globalViewport.hGrid), codeBlock.gaps),
			Math.floor(relativeX / state.graphicHelper.globalViewport.vGrid) - (codeBlock.padLength + 2),
			'Jump'
		);
		codeBlock.cursor.row = row;
		codeBlock.cursor.col = col;
	};

	const updateGraphics = function (graphicData: CodeBlockGraphicData) {
		if (!state.graphicHelper.spriteLookups) {
			return;
		}

		graphicData.padLength = graphicData.code.length.toString().length;
		const length = graphicData.code.length;

		graphicData.x = graphicData.gridX * state.graphicHelper.globalViewport.vGrid;
		graphicData.y = graphicData.gridY * state.graphicHelper.globalViewport.hGrid;

		graphicData.trimmedCode = [...graphicData.code.slice(0, length + 1)];

		const codeWithLineNumbers = graphicData.trimmedCode.map(
			(line, index) => `${index}`.padStart(graphicData.padLength, '0') + ' ' + line
		);

		graphicData.codeToRender = codeWithLineNumbers.map(line => line.split('').map(char => char.charCodeAt(0)));

		graphicData.codeColors = generateCodeColorMap(codeWithLineNumbers, state.graphicHelper.spriteLookups, [
			...instructionsToHighlight,
			...state.compiler.compilerOptions.environmentExtensions.ignoredKeywords,
		]);

		gaps(graphicData, state);
		pianoKeyboards(graphicData, state);

		graphicData.width =
			Math.max(graphicData.minGridWidth, getLongestLineLength(codeWithLineNumbers) + 4) *
			state.graphicHelper.globalViewport.vGrid;

		errorMessages(graphicData, state);
		bufferPlotters(graphicData, state);
		outputs(graphicData, state);
		inputs(graphicData, state);
		debuggers(graphicData, state);
		switches(graphicData, state);
		buttons(graphicData, state);
		positionOffsetters(graphicData, state);

		graphicData.height = graphicData.codeToRender.length * state.graphicHelper.globalViewport.hGrid;
		graphicData.cursor.x =
			(graphicData.cursor.col + (graphicData.padLength + 2)) * state.graphicHelper.globalViewport.vGrid;
		graphicData.cursor.y =
			gapCalculator(graphicData.cursor.row, graphicData.gaps) * state.graphicHelper.globalViewport.hGrid;
		graphicData.id = getModuleId(graphicData.code) || '';
	};

	const updateGraphicsAll = function () {
		for (const graphicData of state.graphicHelper.activeViewport.codeBlocks) {
			updateGraphics(graphicData);
		}
	};

	const updateSelectedCodeBlock = function () {
		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}
		updateGraphics(state.graphicHelper.selectedCodeBlock);
	};

	events.on('buildError', updateGraphicsAll);
	events.on<CodeBlockClickEvent>('codeBlockClick', onCodeBlockClick);
	events.on<CodeBlockClickEvent>('codeBlockClick', ({ codeBlock }) => updateGraphics(codeBlock));
	events.on('runtimeInitialized', updateGraphicsAll);
	events.on<CodeBlockAddedEvent>('codeBlockAdded', ({ codeBlock }) => updateGraphics(codeBlock));
	events.on('init', updateGraphicsAll);
	events.on('spriteSheetRerendered', updateGraphicsAll);
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateSelectedCodeBlock);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor', updateSelectedCodeBlock);
}
