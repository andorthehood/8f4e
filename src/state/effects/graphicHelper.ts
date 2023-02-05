import { font } from '@8f4e/sprite-generator';

import { HGRID, VGRID } from '../../view/drawers/consts';
import { EventDispatcher, EventHandler } from '../../events';
import { State } from '../types';
import { backSpace, enter, moveCaret, type } from '../helpers/editor';

const keywords =
	/output|inputPointer|local|private|push|div|if|else|end|store|and|greaterThan|branch|greaterOrEqual|add|sub|lessThan|public|xor|shiftRight/;

export default function graphicHelper(state: State, events: EventDispatcher) {
	const onCompilationDone = function () {
		state.modules.forEach(module => {
			const padLength = module.code.length.toString().length;

			const code = module.code.map(
				(line, index) =>
					(line.includes('inputPointer') || index === 0
						? ''.padStart(padLength, ' ')
						: `${index + 1}`.padStart(padLength, '0')) +
					' ' +
					line
			);

			const codeColors = code.map(line => {
				const keywordIndex = line.search(keywords);

				if (line.includes('#')) {
					return [font('grey'), font('grey'), font('grey'), font('green')];
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

			if (!state.graphicHelper.has(module.id)) {
				state.graphicHelper.set(module.id, {
					width: 32 * VGRID,
					height: module.code.length * HGRID,
					code,
					codeColors,
					inputs: new Map(),
					outputs: new Map(),
					cursor: { col: 0, row: 0, offset: VGRID * (padLength + 2) },
				});
			} else {
				state.graphicHelper.get(module.id).code = code;
				state.graphicHelper.get(module.id).codeColors = codeColors;
				state.graphicHelper.get(module.id).height = module.code.length * HGRID;
				state.graphicHelper.get(module.id).cursor.offset = VGRID * (padLength + 2);
			}

			for (let i = 0; i < state.compiler.compiledModules.get(module.id).outputs.length; i++) {
				const output = state.compiler.compiledModules.get(module.id).outputs[i];

				state.graphicHelper.get(module.id).outputs.set(output.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID * 3 + VGRID * code[output.lineNumber - 1].length,
					y: HGRID * (output.lineNumber - 1),
					id: output.id,
				});
			}

			for (let i = 0; i < state.compiler.compiledModules.get(module.id).inputs.length; i++) {
				const input = state.compiler.compiledModules.get(module.id).inputs[i];

				state.graphicHelper.get(module.id).inputs.set(input.id, {
					width: VGRID * 2,
					height: HGRID,
					x: VGRID,
					y: HGRID * (input.lineNumber - 1),
					id: input.id,
				});
			}
		});
	};

	const onKeydown: EventHandler = function (event) {
		const module = state.graphicHelper.get(state.selectedModule.id);

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
	};

	events.on('compilationDone', onCompilationDone);
	events.on('keydown', onKeydown);
}
