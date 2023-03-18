import { font } from '@8f4e/sprite-generator';
import { instructions } from '@8f4e/compiler';

import { HGRID, VGRID } from '../../view/drawers/consts';
import { EventDispatcher, EventHandler } from '../../events';
import { GraphicHelper, ModuleGraphicData, State } from '../types';
import { backSpace, enter, moveCaret, type } from '../helpers/editor';
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

const keywords = new RegExp(Object.keys(instructions).join('|'));

function calculateCursorYPosition(row: number, gaps: ModuleGraphicData['gaps']) {
	let newRow = row;
	for (const [gapRow, gap] of gaps) {
		if (row >= gapRow) {
			newRow += gap.size;
		}
	}
	return newRow * HGRID;
}

export default function graphicHelper(state: State, events: EventDispatcher) {
	const updateGraphics = function () {
		state.project.modules.forEach(module => {
			const padLength = module.code.length.toString().length;
			const length = module.isOpen ? module.code.length : getLastMemoryInstructionLine(module.code);

			const trimmedCode = [...module.code.slice(0, length + 1), ''];

			const codeWithLineNumbers = trimmedCode.map((line, index) => `${index}`.padStart(padLength, '0') + ' ' + line);

			const width = Math.max(32, getLongestLineLength(codeWithLineNumbers));

			const codeColors = codeWithLineNumbers.map(line => {
				const keywordIndex = line.search(keywords);

				if (line.includes('#')) {
					return [font('grey'), font('grey'), font('grey'), font('light_grey')];
				}

				return line.split('').map((char, index) => {
					if (index === 0) {
						return font('grey');
					}
					if (index === padLength) {
						return font('white');
					}
					if (index === keywordIndex) {
						return font('purple');
					}
					if (char === ' ') {
						return font('white');
					}
					return undefined;
				});
			});

			const graphicData = state.graphicHelper.modules.get(module) || {
				width: width * VGRID,
				height: codeWithLineNumbers.length * HGRID,
				code: module.code,
				codeWithLineNumbers,
				codeColors,
				inputs: new Map(),
				outputs: new Map(),
				debuggers: new Map(),
				switches: new Map(),
				scopes: new Map(),
				cursor: { col: 0, row: 0, x: VGRID * (padLength + 2), y: 0 },
				id: getModuleId(module.code) || '',
				gaps: new Map(),
				errorMessages: new Map(),
			};
			state.graphicHelper.modules.set(module, graphicData);

			graphicData.gaps.clear();
			graphicData.errorMessages.clear();

			state.compiler.buildErrors.forEach(buildError => {
				if (buildError.moduleId !== graphicData.id) {
					return;
				}
				graphicData.errorMessages.set(buildError.lineNumber, {
					x: 0,
					y: calculateCursorYPosition(buildError.lineNumber, graphicData.gaps),
					message: ['Error:', buildError.message],
				});
				graphicData.gaps.set(buildError.lineNumber, { size: 2 });
			});

			graphicData.scopes.clear();
			parseScopes(trimmedCode).forEach(scope => {
				graphicData.scopes.set(scope.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID * (4 + padLength),
					y: calculateCursorYPosition(scope.lineNumber + 1, graphicData.gaps),
					id: scope.id,
					minValue: scope.minValue,
					maxValue: scope.maxValue,
				});
				graphicData.gaps.set(scope.lineNumber + 1, { size: 9 });
			});

			graphicData.outputs.clear();
			parseOutputs(trimmedCode).forEach(output => {
				graphicData.outputs.set(output.id, {
					width: VGRID * 2,
					height: HGRID,
					x: (width - 2) * VGRID,
					y: calculateCursorYPosition(output.lineNumber, graphicData.gaps),
					id: output.id,
				});
			});

			graphicData.inputs.clear();
			parseInputs(trimmedCode).forEach(input => {
				graphicData.inputs.set(input.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID,
					y: calculateCursorYPosition(input.lineNumber, graphicData.gaps),
					id: input.id,
				});
			});

			graphicData.debuggers.clear();
			parseDebuggers(trimmedCode).forEach(_debugger => {
				graphicData.debuggers.set(_debugger.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID * (3 + padLength) + VGRID * trimmedCode[_debugger.lineNumber].length,
					y: calculateCursorYPosition(_debugger.lineNumber, graphicData.gaps),
					id: _debugger.id,
				});
			});

			graphicData.switches.clear();
			parseSwitches(trimmedCode).forEach(_switch => {
				graphicData.switches.set(_switch.id, {
					width: VGRID * 4,
					height: HGRID,
					x: (width - 4) * VGRID,
					y: calculateCursorYPosition(_switch.lineNumber, graphicData.gaps),
					id: _switch.id,
					offValue: _switch.offValue,
					onValue: _switch.onValue,
				});
			});

			graphicData.codeWithLineNumbers = codeWithLineNumbers;
			graphicData.codeColors = codeColors;

			let offset = 0;

			for (const [row, gap] of graphicData.gaps) {
				graphicData.codeWithLineNumbers.splice(row + offset, 0, ...new Array(gap.size).fill(' '));
				graphicData.codeColors.splice(row + offset, 0, ...new Array(gap.size).fill([]));
				offset += gap.size;
			}

			graphicData.height = codeWithLineNumbers.length * HGRID;
			graphicData.cursor.x = (graphicData.cursor.col + (padLength + 2)) * VGRID;
			graphicData.cursor.y = calculateCursorYPosition(graphicData.cursor.row, graphicData.gaps);
			graphicData.id = getModuleId(module.code) || '';
			graphicData.width = width * VGRID;
		});

		state.graphicHelper.connections = state.project.connections
			.map(connection => {
				const [fromModule] =
					Array.from(state.graphicHelper.modules).find(([, graphicData]) => {
						return graphicData.id === connection.fromModuleId;
					}) || [];

				const [toModule] =
					Array.from(state.graphicHelper.modules).find(([, graphicData]) => {
						return graphicData.id === connection.toModuleId;
					}) || [];

				if (!fromModule || !toModule) {
					return;
				}

				return {
					fromModule,
					toModule,
					fromConnectorId: connection.fromConnectorId,
					toConnectorId: connection.toConnectorId,
				};
			})
			.filter(connection => connection !== undefined) as GraphicHelper['connections'];
	};

	const onKeydown: EventHandler = function (event) {
		if (!state.selectedModule) {
			return;
		}

		const module = state.graphicHelper.modules.get(state.selectedModule);

		if (!module) {
			return;
		}

		let newPosition: [number, number] = [module.cursor.row, module.cursor.col];

		switch (event?.key) {
			case undefined:
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'ArrowRight':
			case 'ArrowDown':
				newPosition = moveCaret(state.selectedModule.code, module.cursor.row, module.cursor.col, event.key);
				module.cursor.row = newPosition[0];
				module.cursor.col = newPosition[1];
				break;
			case 'Backspace':
				// eslint-disable-next-line no-case-declarations
				const bp = backSpace(state.selectedModule.code, module.cursor.row, module.cursor.col);
				module.cursor.row = bp.row;
				module.cursor.col = bp.col;

				state.selectedModule.code = bp.code;

				events.dispatch('saveState');
				events.dispatch('codeChange');
				break;
			case 'Enter':
				// eslint-disable-next-line no-case-declarations
				const ent = enter(state.selectedModule.code, module.cursor.row, module.cursor.col);
				module.cursor.row = ent.row;
				module.cursor.col = ent.col;

				state.selectedModule.code = ent.code;

				events.dispatch('saveState');
				events.dispatch('codeChange');
				break;
			default:
				if (event?.key.length === 1) {
					// eslint-disable-next-line no-case-declarations
					const bp = type(state.selectedModule.code, module.cursor.row, module.cursor.col, event.key);
					module.cursor.row = bp.row;
					module.cursor.col = bp.col;

					state.selectedModule.code = bp.code;

					events.dispatch('saveState');
					events.dispatch('codeChange');
				}
		}

		updateGraphics();
	};

	events.on('moduleClick', updateGraphics);
	events.on('compilationDone', updateGraphics);
	events.on('init', updateGraphics);
	events.on('keydown', onKeydown);
}
