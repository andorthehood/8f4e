import { HGRID, VGRID } from '../../view/drawers/consts';
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
	parseScopes,
	parseSwitches,
	getLongestLineLength,
	getModuleId,
} from '../helpers/codeParsers';

export default function graphicHelper(state: State, events: EventDispatcher) {
	const onModuleClick = function ({ relativeX = 0, relativeY = 0, module }: EventObject) {
		const [row, col] = moveCaret(
			module.code,
			reverseGapCalculator(Math.floor(relativeY / HGRID), module.gaps),
			Math.floor(relativeX / VGRID) - (module.padLength + 2),
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
		graphicData.padLength = graphicData.code.length.toString().length;
		const length = graphicData.isOpen ? graphicData.code.length : getLastMemoryInstructionLine(graphicData.code);
		const trimmedCode = [...graphicData.code.slice(0, length + 1)];

		graphicData.codeWithLineNumbers = trimmedCode.map(
			(line, index) => `${index}`.padStart(graphicData.padLength, '0') + ' ' + line
		);

		graphicData.width = Math.max(32, getLongestLineLength(graphicData.codeWithLineNumbers) + 4) * VGRID;

		graphicData.codeColors = generateCodeColorMap(graphicData.codeWithLineNumbers);

		graphicData.gaps.clear();
		state.compiler.buildErrors.forEach(buildError => {
			if (buildError.moduleId !== graphicData.id) {
				return;
			}
			graphicData.gaps.set(buildError.lineNumber, { size: 2 });
		});
		parseScopes(trimmedCode).forEach(scope => {
			graphicData.gaps.set(scope.lineNumber, { size: 9 });
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
				y: (gapCalculator(buildError.lineNumber, graphicData.gaps) + 1) * HGRID,
				message: ['Error:', buildError.message],
			});
		});

		graphicData.scopes.clear();
		parseScopes(trimmedCode).forEach(scope => {
			graphicData.scopes.set(scope.id, {
				width: VGRID * 2,
				height: HGRID,
				x: VGRID * (4 + graphicData.padLength),
				y: (gapCalculator(scope.lineNumber, graphicData.gaps) + 1) * HGRID,
				id: scope.id,
				minValue: scope.minValue,
				maxValue: scope.maxValue,
			});
		});

		graphicData.outputs.clear();
		parseOutputs(trimmedCode).forEach(output => {
			const { byteAddress = 0 } =
				state.compiler.compiledModules.get(getModuleId(graphicData.code) || '')?.memoryMap.get(output.id) || {};

			const out: Output = {
				width: VGRID * 2,
				height: HGRID,
				x: graphicData.width - 3 * VGRID,
				y: gapCalculator(output.lineNumber, graphicData.gaps) * HGRID,
				id: output.id,
				module: graphicData,
				calibratedMax: 0,
				calibratedMin: 0,
			};

			graphicData.outputs.set(output.id, out);
			state.graphicHelper.outputsByWordAddress.set(byteAddress, out);
		});

		graphicData.inputs.clear();
		parseInputs(trimmedCode).forEach(input => {
			const { wordAddress = 0 } =
				state.compiler.compiledModules.get(getModuleId(graphicData.code) || '')?.memoryMap.get(input.id) || {};
			graphicData.inputs.set(input.id, {
				width: VGRID * 2,
				height: HGRID,
				x: 0,
				y: gapCalculator(input.lineNumber, graphicData.gaps) * HGRID,
				id: input.id,
				wordAddress,
				module: graphicData,
			});
		});

		graphicData.debuggers.clear();
		parseDebuggers(trimmedCode).forEach(_debugger => {
			graphicData.debuggers.set(_debugger.id, {
				width: VGRID * 2,
				height: HGRID,
				x: VGRID * (3 + graphicData.padLength) + VGRID * trimmedCode[_debugger.lineNumber].length,
				y: gapCalculator(_debugger.lineNumber, graphicData.gaps) * HGRID,
				id: _debugger.id,
			});
		});

		graphicData.switches.clear();
		parseSwitches(trimmedCode).forEach(_switch => {
			graphicData.switches.set(_switch.id, {
				width: VGRID * 4,
				height: HGRID,
				x: graphicData.width - 4 * VGRID,
				y: gapCalculator(_switch.lineNumber, graphicData.gaps) * HGRID,
				id: _switch.id,
				offValue: _switch.offValue,
				onValue: _switch.onValue,
			});
		});

		graphicData.height = graphicData.codeWithLineNumbers.length * HGRID;
		graphicData.cursor.x = (graphicData.cursor.col + (graphicData.padLength + 2)) * VGRID;
		graphicData.cursor.y = gapCalculator(graphicData.cursor.row, graphicData.gaps) * HGRID;
		graphicData.id = getModuleId(graphicData.code) || '';
	};

	const onKeydown: EventHandler = function (event) {
		if (!state.selectedModule) {
			return;
		}

		const module = state.selectedModule;

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
	events.on('compilationDone', updateGraphicsAll);
	events.on('moduleAdded', ({ module }) => updateGraphics(module));
	events.on('init', updateGraphicsAll);
	events.on('keydown', onKeydown);
}
