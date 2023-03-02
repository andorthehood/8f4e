import { font } from '@8f4e/sprite-generator';
import { instructions } from '@8f4e/compiler';

import { HGRID, VGRID } from '../../view/drawers/consts';
import { EventDispatcher, EventHandler } from '../../events';
import { GraphicHelper, State } from '../types';
import { backSpace, enter, moveCaret, type } from '../helpers/editor';
import {
	parseDebuggers,
	parseInputs,
	parseOutputs,
	getLastMemoryInstructionLine,
	parseScopes,
	parseSwitches,
} from '../helpers/codeParsers';

const keywords = new RegExp(Object.keys(instructions).join('|'));

function getModuleId(code: string[]): string {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];
		if (instruction === 'module') {
			return args[0] || '';
		}
	}
	return '';
}

export default function graphicHelper(state: State, events: EventDispatcher) {
	const onCompilationDone = function () {
		state.modules.forEach(module => {
			const padLength = module.code.length.toString().length;
			const length = module.isOpen ? module.code.length : getLastMemoryInstructionLine(module.code);

			const trimmedCode = [...module.code.slice(0, length + 1), ''];

			const codeWithLineNumbers = trimmedCode.map(
				(line, index) =>
					(line.includes('memory in') ? ''.padStart(padLength, ' ') : `${index}`.padStart(padLength, '0')) + ' ' + line
			);

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

			const graphicData = state.graphicHelper.modules.get(module);
			if (!graphicData) {
				state.graphicHelper.modules.set(module, {
					width: 32 * VGRID,
					height: trimmedCode.length * HGRID,
					code: codeWithLineNumbers,
					codeColors,
					inputs: new Map(),
					outputs: new Map(),
					debuggers: new Map(),
					switches: new Map(),
					scopes: new Map(),
					cursor: { col: 0, row: 0, offset: VGRID * (padLength + 2) },
					id: getModuleId(module.code) || '',
				});
			} else {
				graphicData.code = codeWithLineNumbers;
				graphicData.codeColors = codeColors;
				graphicData.height = trimmedCode.length * HGRID;
				graphicData.cursor.offset = VGRID * (padLength + 2);
				graphicData.id = getModuleId(module.code) || '';
			}

			state.graphicHelper.modules.get(module)?.outputs.clear();
			parseOutputs(trimmedCode).forEach(output => {
				state.graphicHelper.modules.get(module)?.outputs.set(output.id, {
					width: VGRID * 2,
					height: HGRID,
					x: 30 * VGRID, //VGRID * 3 + VGRID * code[output.lineNumber].length,
					y: HGRID * output.lineNumber,
					id: output.id,
				});
			});

			state.graphicHelper.modules.get(module)?.inputs.clear();
			parseInputs(trimmedCode).forEach(input => {
				state.graphicHelper.modules.get(module)?.inputs.set(input.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID,
					y: HGRID * input.lineNumber,
					id: input.id,
				});
			});

			state.graphicHelper.modules.get(module)?.debuggers.clear();
			parseDebuggers(trimmedCode).forEach(_debugger => {
				state.graphicHelper.modules.get(module)?.debuggers.set(_debugger.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID * (3 + padLength) + VGRID * trimmedCode[_debugger.lineNumber].length,
					y: HGRID * _debugger.lineNumber,
					id: _debugger.id,
				});
			});

			state.graphicHelper.modules.get(module)?.scopes.clear();
			parseScopes(trimmedCode).forEach(scope => {
				state.graphicHelper.modules.get(module)?.scopes.set(scope.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID * (4 + padLength),
					y: HGRID * (scope.lineNumber + 1),
					id: scope.id,
					minValue: scope.minValue,
					maxValue: scope.maxValue,
				});
			});

			state.graphicHelper.modules.get(module)?.switches.clear();
			parseSwitches(trimmedCode).forEach(_switch => {
				state.graphicHelper.modules.get(module)?.switches.set(_switch.id, {
					width: VGRID * 4,
					height: HGRID,
					x: VGRID * (3 + padLength) + VGRID * trimmedCode[_switch.lineNumber].length,
					y: HGRID * _switch.lineNumber,
					id: _switch.id,
					offValue: _switch.offValue,
					onValue: _switch.onValue,
				});
			});
		});

		state.graphicHelper.connections = state.connections
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
				onCompilationDone();
				break;
			case 'Enter':
				// eslint-disable-next-line no-case-declarations
				const ent = enter(state.selectedModule.code, module.cursor.row, module.cursor.col);
				module.cursor.row = ent.row;
				module.cursor.col = ent.col;
				state.selectedModule.code = ent.code;
				onCompilationDone();
				break;
			default:
				if (event?.key.length === 1) {
					// eslint-disable-next-line no-case-declarations
					const bp = type(state.selectedModule.code, module.cursor.row, module.cursor.col, event.key);
					module.cursor.row = bp.row;
					module.cursor.col = bp.col;
					state.selectedModule.code = bp.code;
					onCompilationDone();
				}
		}

		events.dispatch('saveState');
	};

	events.on('moduleClick', onCompilationDone);
	events.on('compilationDone', onCompilationDone);
	events.on('init', onCompilationDone);
	events.on('keydown', onKeydown);
}
