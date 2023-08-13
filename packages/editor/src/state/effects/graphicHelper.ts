import { instructions } from '@8f4e/compiler';

import { EventDispatcher, EventHandler, EventObject } from '../../events';
import { ModuleGraphicData, Output, State } from '../types';
import {
	backSpace,
	enter,
	moveCaret,
	type,
	gapCalculator,
	reverseGapCalculator,
	generateCodeColorMap,
} from '../helpers/editor';
import {
	parseDebuggers,
	parseInputs,
	parseOutputs,
	getLastMemoryInstructionLine,
	parseBufferPlotters,
	parseSwitches,
	getLongestLineLength,
	getModuleId,
	parseButtons,
	parsePositionOffsetters,
	parsePianoKeyboards,
} from '../helpers/codeParsers';
import resolveMemoryIdentifier from '../helpers/resolveMemoryIdentifier';

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
		const trimmedCode = [...graphicData.code.slice(0, length + 1)];

		graphicData.x = graphicData.gridX * state.graphicHelper.viewport.vGrid;
		graphicData.y = graphicData.gridY * state.graphicHelper.viewport.hGrid;

		graphicData.codeWithLineNumbers = trimmedCode.map(
			(line, index) => `${index}`.padStart(graphicData.padLength, '0') + ' ' + line
		);

		graphicData.width =
			Math.max(32, getLongestLineLength(graphicData.codeWithLineNumbers) + 4) * state.graphicHelper.viewport.vGrid;

		graphicData.codeColors = generateCodeColorMap(graphicData.codeWithLineNumbers, state.graphicHelper.spriteLookups, [
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
		parseBufferPlotters(trimmedCode).forEach(plotter => {
			graphicData.gaps.set(plotter.lineNumber, { size: 8 });
		});
		parsePianoKeyboards(trimmedCode).forEach(pianoKeyboard => {
			graphicData.gaps.set(pianoKeyboard.lineNumber, { size: 5 });
		});

		const gaps = Array.from(graphicData.gaps).sort(([a], [b]) => {
			return b - a;
		});

		gaps.forEach(([row, gap]) => {
			graphicData.codeWithLineNumbers.splice(row + 1, 0, ...new Array(gap.size).fill(' '));
			graphicData.codeColors.splice(row + 1, 0, ...new Array(gap.size).fill([]));
		});

		graphicData.codeToRender = graphicData.codeWithLineNumbers.map(line =>
			line.split('').map(char => char.charCodeAt(0))
		);

		graphicData.errorMessages.clear();
		state.compiler.buildErrors.forEach(buildError => {
			if (buildError.moduleId !== graphicData.id) {
				return;
			}
			graphicData.errorMessages.set(buildError.lineNumber, {
				x: 0,
				y: (gapCalculator(buildError.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
				message: ['Error:', buildError.message],
			});
		});

		graphicData.bufferPlotters.clear();
		parseBufferPlotters(trimmedCode).forEach(plotter => {
			graphicData.bufferPlotters.set(plotter.id, {
				width: state.graphicHelper.viewport.vGrid * 2,
				height: state.graphicHelper.viewport.hGrid,
				x: 0,
				y: (gapCalculator(plotter.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
				id: plotter.id,
				minValue: plotter.minValue,
				maxValue: plotter.maxValue,
			});
		});

		graphicData.outputs.clear();
		parseOutputs(trimmedCode).forEach(output => {
			const memory = state.compiler.compiledModules.get(getModuleId(graphicData.code) || '')?.memoryMap.get(output.id);

			if (!memory) {
				return;
			}

			const out: Output = {
				width: state.graphicHelper.viewport.vGrid * 2,
				height: state.graphicHelper.viewport.hGrid,
				x: graphicData.width - 3 * state.graphicHelper.viewport.vGrid,
				y: gapCalculator(output.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
				id: output.id,
				module: graphicData,
				calibratedMax: 0,
				calibratedMin: 0,
				memory,
			};

			graphicData.outputs.set(output.id, out);
			state.graphicHelper.outputsByWordAddress.set(memory.byteAddress, out);
		});

		graphicData.inputs.clear();
		parseInputs(trimmedCode).forEach(input => {
			const memory = state.compiler.compiledModules.get(getModuleId(graphicData.code) || '')?.memoryMap.get(input.id);

			if (!memory) {
				return;
			}

			graphicData.inputs.set(input.id, {
				width: state.graphicHelper.viewport.vGrid * 2,
				height: state.graphicHelper.viewport.hGrid,
				x: 0,
				y: gapCalculator(input.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
				id: input.id,
				wordAddress: memory.wordAddress,
				module: graphicData,
			});
		});

		graphicData.debuggers.clear();
		parseDebuggers(trimmedCode).forEach(_debugger => {
			const memory = resolveMemoryIdentifier(state, graphicData.id, _debugger.id);

			if (!memory) {
				return;
			}

			graphicData.debuggers.set(_debugger.id, {
				width: state.graphicHelper.viewport.vGrid * 2,
				height: state.graphicHelper.viewport.hGrid,
				x:
					state.graphicHelper.viewport.vGrid * (3 + graphicData.padLength) +
					state.graphicHelper.viewport.vGrid * trimmedCode[_debugger.lineNumber].length,
				y: gapCalculator(_debugger.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
				id: _debugger.id,
				memory: memory.memory,
				showAddress: memory.showAddress,
				showEndAddress: memory.showEndAddress,
				showBinary: memory.showBinary,
				bufferPointer: memory.bufferPointer,
			});
		});

		graphicData.switches.clear();
		parseSwitches(trimmedCode).forEach(_switch => {
			graphicData.switches.set(_switch.id, {
				width: state.graphicHelper.viewport.vGrid * 4,
				height: state.graphicHelper.viewport.hGrid,
				x: graphicData.width - 4 * state.graphicHelper.viewport.vGrid,
				y: gapCalculator(_switch.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
				id: _switch.id,
				offValue: _switch.offValue,
				onValue: _switch.onValue,
			});
		});

		graphicData.buttons.clear();
		parseButtons(trimmedCode).forEach(_switch => {
			graphicData.buttons.set(_switch.id, {
				width: state.graphicHelper.viewport.vGrid * 4,
				height: state.graphicHelper.viewport.hGrid,
				x: graphicData.width - 4 * state.graphicHelper.viewport.vGrid,
				y: gapCalculator(_switch.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
				id: _switch.id,
				offValue: _switch.offValue,
				onValue: _switch.onValue,
			});
		});

		graphicData.pianoKeyboards.clear();
		parsePianoKeyboards(trimmedCode).forEach(pianoKeyboard => {
			const memoryIdentifierKeysList = resolveMemoryIdentifier(
				state,
				graphicData.id,
				pianoKeyboard.pressedKeysListMemoryId
			);
			const memoryIdentifierNumberOfKeys = resolveMemoryIdentifier(
				state,
				graphicData.id,
				pianoKeyboard.pressedNumberOfKeysMemoryId
			);

			if (!memoryIdentifierKeysList || !memoryIdentifierNumberOfKeys) {
				return;
			}

			graphicData.pianoKeyboards.set(pianoKeyboard.lineNumber, {
				x: 0,
				y: (gapCalculator(pianoKeyboard.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
				width: 12 * (state.graphicHelper.viewport.vGrid * 2),
				height: state.graphicHelper.viewport.hGrid * 5,
				keyWidth: state.graphicHelper.viewport.vGrid * 2,
				pressedKeys: pianoKeyboard.pressedKeys,
				pressedKeysListMemory: memoryIdentifierKeysList.memory,
				pressedNumberOfKeysMemory: memoryIdentifierNumberOfKeys.memory,
				startingNumber: pianoKeyboard.startingNumber,
			});
		});

		graphicData.positionOffsetterXWordAddress = undefined;
		graphicData.positionOffsetterYWordAddress = undefined;
		const offsetters = parsePositionOffsetters(trimmedCode);

		if (offsetters.length === 0) {
			graphicData.offsetX = 0;
			graphicData.offsetY = 0;
		}

		offsetters.forEach(offsetter => {
			const memory = resolveMemoryIdentifier(state, graphicData.id, offsetter.memory);

			if (!memory || !memory.memory.isInteger) {
				return;
			}

			if (offsetter.axis === 'x') {
				graphicData.positionOffsetterXWordAddress = memory.memory.wordAddress;
			}
			if (offsetter.axis === 'y') {
				graphicData.positionOffsetterYWordAddress = memory.memory.wordAddress;
			}
		});

		graphicData.height = graphicData.codeWithLineNumbers.length * state.graphicHelper.viewport.hGrid;
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
