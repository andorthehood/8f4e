import { StateManager } from '@8f4e/state-manager';
import { getBlockType } from '@8f4e/compiler/syntax';

import gaps from './gaps';
import positionOffsetters from './positionOffsetters';
import getCodeBlockGridWidth from './getCodeBlockGridWidth';

import bufferPlotters from '../bufferPlotters/updateGraphicData';
import bufferScanners from '../bufferScanners/updateGraphicData';
import buttons from '../buttons/updateGraphicData';
import debuggers from '../debuggers/updateGraphicData';
import inputs from '../inputs/updateGraphicData';
import outputs from '../outputs/updateGraphicData';
import pianoKeyboards from '../pianoKeyboard/updateGraphicData';
import switches from '../switches/updateGraphicData';
import sliders from '../sliders/updateGraphicData';
import blockHighlights from '../blockHighlights/updateGraphicData';
import { CodeBlockClickEvent } from '../codeBlockDragger/effect';
import wrapText from '../../utils/wrapText';
import gapCalculator from '../../../code-editing/gapCalculator';
import highlightSyntax8f4e from '../../../code-editing/highlightSyntax8f4e';
import highlightSyntaxGlsl from '../../../code-editing/highlightSyntaxGlsl';
import { moveCaret } from '../../../code-editing/moveCaret';
import reverseGapCalculator from '../../../code-editing/reverseGapCalculator';
import getCodeBlockId from '../../utils/getCodeBlockId';

import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

export default function graphicHelper(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();
	const onCodeBlockClick = function ({ relativeX = 0, relativeY = 0, codeBlock }: CodeBlockClickEvent) {
		const [row, col] = moveCaret(
			codeBlock.code,
			reverseGapCalculator(Math.floor(relativeY / state.viewport.hGrid), codeBlock.gaps),
			Math.floor(relativeX / state.viewport.vGrid) - (codeBlock.lineNumberColumnWidth + 2),
			'jump'
		);
		codeBlock.cursor.row = row;
		codeBlock.cursor.col = col;
	};

	const updateGraphics = function (graphicData: CodeBlockGraphicData) {
		if (!state.graphicHelper.spriteLookups) {
			return;
		}

		const spriteLookups = state.graphicHelper.spriteLookups;

		graphicData.lineNumberColumnWidth = graphicData.code.length.toString().length;

		const codeWithLineNumbers = graphicData.code.map(
			(line, index) => `${index}`.padStart(graphicData.lineNumberColumnWidth, '0') + ' ' + line
		);

		graphicData.codeToRender = codeWithLineNumbers.map(line => line.split('').map(char => char.charCodeAt(0)));

		// Choose highlighter based on block type and get syntax colors for raw code
		let rawCodeColors;
		if (graphicData.blockType === 'vertexShader' || graphicData.blockType === 'fragmentShader') {
			rawCodeColors = highlightSyntaxGlsl(graphicData.code, spriteLookups);
		} else {
			rawCodeColors = highlightSyntax8f4e(graphicData.code, spriteLookups);
		}

		// Merge raw code colors into color matrix aligned with codeWithLineNumbers
		// by offsetting indices to account for line number prefix
		const lineNumberPrefixLength = graphicData.lineNumberColumnWidth + 1; // +1 for space
		graphicData.codeColors = codeWithLineNumbers.map((line, lineIndex) => {
			const lineColors = new Array(line.length).fill(undefined);

			// Apply line number color at the first column (color persists until changed)
			lineColors[0] = spriteLookups.fontLineNumber;

			// Reset to code color after line number prefix (at the space separator)
			lineColors[graphicData.lineNumberColumnWidth] = spriteLookups.fontCode;

			// Merge syntax colors from raw code, offset by prefix length
			const rawColors = rawCodeColors[lineIndex] || [];
			rawColors.forEach((color, i) => {
				if (color !== undefined) {
					lineColors[i + lineNumberPrefixLength] = color;
				}
			});

			return lineColors;
		});

		gaps(graphicData);
		pianoKeyboards(graphicData, state);

		graphicData.width = getCodeBlockGridWidth(graphicData.code, graphicData.minGridWidth) * state.viewport.vGrid;

		bufferPlotters(graphicData, state);
		bufferScanners(graphicData, state);
		outputs(graphicData, state);
		inputs(graphicData, state);
		debuggers(graphicData, state);
		switches(graphicData, state);
		buttons(graphicData, state);
		sliders(graphicData, state);
		positionOffsetters(graphicData, state);
		blockHighlights(graphicData, state);

		graphicData.height = graphicData.codeToRender.length * state.viewport.hGrid;
		graphicData.cursor.x = (graphicData.cursor.col + (graphicData.lineNumberColumnWidth + 2)) * state.viewport.vGrid;
		graphicData.cursor.y = gapCalculator(graphicData.cursor.row, graphicData.gaps) * state.viewport.hGrid;
		graphicData.id = getCodeBlockId(graphicData.code);
	};

	const updateGraphicsAll = function () {
		for (const graphicData of state.graphicHelper.codeBlocks) {
			updateGraphics(graphicData);
		}
	};

	const recomputePixelCoordinatesAndUpdateGraphics = function () {
		// When viewport grid dimensions change (e.g., font change), recompute pixel positions
		// from the stable grid coordinates, then update graphics. Combined into single iteration.
		for (const codeBlock of state.graphicHelper.codeBlocks) {
			codeBlock.x = codeBlock.gridX * state.viewport.vGrid;
			codeBlock.y = codeBlock.gridY * state.viewport.hGrid;
			updateGraphics(codeBlock);
		}
	};

	const updateSelectedCodeBlock = function () {
		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}
		updateGraphics(state.graphicHelper.selectedCodeBlock);
	};

	const updateProgrammaticSelectedCodeBlock = function () {
		if (!state.graphicHelper.selectedCodeBlockForProgrammaticEdit) {
			return;
		}
		updateGraphics(state.graphicHelper.selectedCodeBlockForProgrammaticEdit);
	};

	const populateCodeBlocks = function () {
		if (!state.initialProjectState) {
			return;
		}

		state.graphicHelper.outputsByWordAddress.clear();
		state.graphicHelper.selectedCodeBlock = undefined;
		state.graphicHelper.selectedCodeBlockForProgrammaticEdit = undefined;
		state.graphicHelper.draggedCodeBlock = undefined;
		state.graphicHelper.nextCodeBlockCreationIndex = 0;
		state.viewport.x = state.initialProjectState.viewport.gridCoordinates.x * state.viewport.vGrid;
		state.viewport.y = state.initialProjectState.viewport.gridCoordinates.y * state.viewport.hGrid;
		const codeBlocks = state.initialProjectState.codeBlocks.map(codeBlock => {
			const creationIndex = state.graphicHelper.nextCodeBlockCreationIndex;
			state.graphicHelper.nextCodeBlockCreationIndex++;
			// Compute grid coordinates first as source of truth
			const gridX = codeBlock.gridCoordinates.x;
			const gridY = codeBlock.gridCoordinates.y;
			// Compute pixel coordinates from grid coordinates
			const pixelX = gridX * state.viewport.vGrid;
			const pixelY = gridY * state.viewport.hGrid;

			return {
				width: 0,
				minGridWidth: 32,
				height: 0,
				code: codeBlock.code,
				codeColors: [],
				codeToRender: [],
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
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				id: getCodeBlockId(codeBlock.code),
				gaps: new Map(),
				gridX,
				gridY,
				x: pixelX,
				y: pixelY,
				offsetX: 0,
				offsetY: 0,
				lineNumberColumnWidth: 1,
				lastUpdated: Date.now(),
				creationIndex,
				blockType: getBlockType(codeBlock.code),
				disabled: codeBlock.disabled || false,
			} as CodeBlockGraphicData;
		});

		store.set('graphicHelper.codeBlocks', codeBlocks);
	};

	function updateErrorMessages() {
		const codeErrors = [
			...state.codeErrors.compilationErrors,
			...state.codeErrors.projectConfigErrors,
			...state.codeErrors.editorConfigErrors,
		];
		state.graphicHelper.codeBlocks.forEach(codeBlock => {
			codeBlock.extras.errorMessages = [];
			codeErrors.forEach(codeError => {
				if (codeBlock.creationIndex === codeError.codeBlockId || codeBlock.id === codeError.codeBlockId) {
					const message = wrapText(codeError.message, codeBlock.width / state.viewport.vGrid - 1);

					codeBlock.extras.errorMessages.push({
						x: 0,
						y: (gapCalculator(codeError.lineNumber, codeBlock.gaps) + 1) * state.viewport.hGrid,
						message: ['Error:', ...message],
						lineNumber: codeError.lineNumber,
					});

					updateGraphics(codeBlock);
				}
			});
		});
	}

	updateErrorMessages();

	events.on<CodeBlockClickEvent>('codeBlockClick', onCodeBlockClick);
	events.on<CodeBlockClickEvent>('codeBlockClick', ({ codeBlock }) => updateGraphics(codeBlock));
	events.on('runtimeInitialized', updateGraphicsAll);
	events.on('spriteSheetRerendered', recomputePixelCoordinatesAndUpdateGraphics);
	store.subscribe('codeErrors', updateErrorMessages);
	store.subscribe('initialProjectState', populateCodeBlocks);
	store.subscribe('graphicHelper.codeBlocks', updateGraphicsAll);
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateSelectedCodeBlock);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor', updateSelectedCodeBlock);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', updateProgrammaticSelectedCodeBlock);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.cursor', updateProgrammaticSelectedCodeBlock);
}
