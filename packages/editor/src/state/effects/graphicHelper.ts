import { instructions } from '@8f4e/compiler';

import pianoKeyboards, { parsePianoKeyboards } from './graphicHelper/pianoKeyboards';
import bufferPlotters, { parseBufferPlotters } from './graphicHelper/bufferPlotters';
import outputs from './graphicHelper/outputs';
import inputs from './graphicHelper/inputs';
import debuggers from './graphicHelper/debuggers';
import switches from './graphicHelper/switches';
import buttons from './graphicHelper/buttons';
import errorMessages from './graphicHelper/errorMessages';
import positionOffsetters from './graphicHelper/positionOffsetters';

import { EventDispatcher, EventHandler, EventObject } from '../../events';
import { ModuleGraphicData, State } from '../types';
import {
	backSpace,
	enter,
	moveCaret,
	type,
	gapCalculator,
	reverseGapCalculator,
	generateCodeColorMap,
} from '../helpers/editor';
import { getLastMemoryInstructionLine, getLongestLineLength, getModuleId } from '../helpers/codeParsers';

export default function graphicHelper(state: State, events: EventDispatcher) {
	const onModuleClick = function ({ relativeX = 0, relativeY = 0, module }: EventObject) {
		const [row, col] = moveCaret(
			module.code,
			reverseGapCalculator(Math.floor(relativeY / state.graphicHelper.viewport.hGrid), module.gaps),
			Math.floor(relativeX / state.graphicHelper.viewport.vGrid) - (module.padLength + 2),
			'Jump'
		);
		module.cursor.row = row;
		module.cursor.col = col;
	};

	const updateGraphicsAll = function () {
		for (const graphicData of state.graphicHelper.modules) {
			updateGraphics(graphicData);
		}
	};

	const updateGraphics = function (graphicData: ModuleGraphicData) {
		if (!state.graphicHelper.spriteLookups) {
			return;
		}

		graphicData.padLength = graphicData.code.length.toString().length;
		const length = graphicData.isOpen ? graphicData.code.length : getLastMemoryInstructionLine(graphicData.code);

		graphicData.x = graphicData.gridX * state.graphicHelper.viewport.vGrid;
		graphicData.y = graphicData.gridY * state.graphicHelper.viewport.hGrid;

		graphicData.trimmedCode = [...graphicData.code.slice(0, length + 1)];

		const codeWithLineNumbers = graphicData.trimmedCode.map(
			(line, index) => `${index}`.padStart(graphicData.padLength, '0') + ' ' + line
		);

		graphicData.codeColors = generateCodeColorMap(codeWithLineNumbers, state.graphicHelper.spriteLookups, [
			...Object.keys(instructions),
			...state.compiler.compilerOptions.environmentExtensions.ignoredKeywords,
		]);

		graphicData.gaps.clear();
		state.compiler.buildErrors.forEach(buildError => {
			if (buildError.moduleId !== graphicData.id) {
				return;
			}
			graphicData.gaps.set(buildError.lineNumber, { size: 2 });
		});
		parseBufferPlotters(graphicData.trimmedCode).forEach(plotter => {
			graphicData.gaps.set(plotter.lineNumber, { size: 8 });
		});
		parsePianoKeyboards(graphicData.trimmedCode).forEach(pianoKeyboard => {
			graphicData.gaps.set(pianoKeyboard.lineNumber, { size: 5 });
		});

		const gaps = Array.from(graphicData.gaps).sort(([a], [b]) => {
			return b - a;
		});

		gaps.forEach(([row, gap]) => {
			codeWithLineNumbers.splice(row + 1, 0, ...new Array(gap.size).fill(' '));
			graphicData.codeColors.splice(row + 1, 0, ...new Array(gap.size).fill([]));
		});

		graphicData.codeToRender = codeWithLineNumbers.map(line => line.split('').map(char => char.charCodeAt(0)));

		pianoKeyboards(graphicData, state);

		graphicData.width =
			Math.max(graphicData.minGridWidth, getLongestLineLength(codeWithLineNumbers) + 4) *
			state.graphicHelper.viewport.vGrid;

		errorMessages(graphicData, state);
		bufferPlotters(graphicData, state);
		outputs(graphicData, state);
		inputs(graphicData, state);
		debuggers(graphicData, state);
		switches(graphicData, state);
		buttons(graphicData, state);
		positionOffsetters(graphicData, state);

		graphicData.height = codeWithLineNumbers.length * state.graphicHelper.viewport.hGrid;
		graphicData.cursor.x = (graphicData.cursor.col + (graphicData.padLength + 2)) * state.graphicHelper.viewport.vGrid;
		graphicData.cursor.y = gapCalculator(graphicData.cursor.row, graphicData.gaps) * state.graphicHelper.viewport.hGrid;
		graphicData.id = getModuleId(graphicData.code) || '';
	};

	const onKeydown: EventHandler = function (event) {
		if (!state.graphicHelper.selectedModule) {
			return;
		}

		const module = state.graphicHelper.selectedModule;

		let newPosition: [number, number] = [module.cursor.row, module.cursor.col];

		switch (event?.key) {
			case undefined:
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'ArrowRight':
			case 'ArrowDown':
				newPosition = moveCaret(module.code, module.cursor.row, module.cursor.col, event.key);
				module.cursor.row = newPosition[0];
				module.cursor.col = newPosition[1];
				break;
			case 'Backspace':
				// eslint-disable-next-line no-case-declarations
				const bp = backSpace(module.code, module.cursor.row, module.cursor.col);
				module.cursor.row = bp.row;
				module.cursor.col = bp.col;

				module.code = bp.code;

				events.dispatch('saveState');
				events.dispatch('codeChange');
				break;
			case 'Enter':
				// eslint-disable-next-line no-case-declarations
				const ent = enter(module.code, module.cursor.row, module.cursor.col);
				module.cursor.row = ent.row;
				module.cursor.col = ent.col;

				module.code = ent.code;

				events.dispatch('saveState');
				events.dispatch('codeChange');
				break;
			default:
				if (event?.key.length === 1) {
					// eslint-disable-next-line no-case-declarations
					const bp = type(module.code, module.cursor.row, module.cursor.col, event.key);
					module.cursor.row = bp.row;
					module.cursor.col = bp.col;

					module.code = bp.code;

					events.dispatch('saveState');
					events.dispatch('codeChange');
				}
		}

		updateGraphics(module);
	};

	events.on('buildError', updateGraphicsAll);
	events.on('moduleClick', onModuleClick);
	events.on('moduleClick', ({ module }) => updateGraphics(module));
	events.on('runtimeInitialized', updateGraphicsAll);
	events.on('moduleAdded', ({ module }) => updateGraphics(module));
	events.on('init', updateGraphicsAll);
	events.on('spriteSheetRerendered', updateGraphicsAll);
	events.on('keydown', onKeydown);
}
