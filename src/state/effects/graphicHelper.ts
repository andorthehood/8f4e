import { font } from '@8f4e/sprite-generator';

import { HGRID, VGRID } from '../../view/drawers/consts';
import { EventDispatcher, EventHandler } from '../../events';
import { State } from '../types';

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
					cursor: { col: 1, row: 1, offset: VGRID * (padLength + 1) },
				});
			} else {
				state.graphicHelper.get(module.id).code = code;
				state.graphicHelper.get(module.id).codeColors = codeColors;
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

	function removeByIndex(str, index) {
		return str.slice(0, index) + str.slice(index + 1);
	}

	function addAtIndex(str, char, index) {
		return str.substring(0, index) + char + str.substring(index);
	}

	function breakAtIndex(str, index): [string, string] {
		return [str.substring(0, index), str.substring(index)];
	}

	const onKeydown: EventHandler = function (event) {
		const module = state.graphicHelper.get(state.selectedModule.id);
		switch (event.key) {
			case 'ArrowLeft':
				module.cursor.col = Math.max(module.cursor.col - 1, 1);
				break;
			case 'ArrowUp':
				module.cursor.row = Math.max(module.cursor.row - 1, 1);
				break;
			case 'ArrowRight':
				module.cursor.col = module.cursor.col + 1;
				break;
			case 'ArrowDown':
				module.cursor.row = module.cursor.row + 1;
				break;
			case 'Backspace':
				module.cursor.col = Math.max(module.cursor.col - 1, 1);
				state.selectedModule.code[module.cursor.row - 1] = removeByIndex(
					state.selectedModule.code[module.cursor.row - 1],
					module.cursor.col - 1
				);
				onCompilationDone();
				break;
			case 'Enter':
				// eslint-disable-next-line no-case-declarations
				const [a, b] = breakAtIndex(state.selectedModule.code[module.cursor.row - 1], module.cursor.col - 1);

				state.selectedModule.code[module.cursor.row - 1] = a;
				state.selectedModule.code.splice(module.cursor.row, 0, '');
				state.selectedModule.code[module.cursor.row] = b;

				module.cursor.row = module.cursor.row + 1;
				onCompilationDone();
				break;
			default:
				if (event.key.length === 1) {
					state.selectedModule.code[module.cursor.row - 1] = addAtIndex(
						state.selectedModule.code[module.cursor.row - 1],
						event.key,
						module.cursor.col - 1
					);
					module.cursor.col = module.cursor.col + 1;
					onCompilationDone();
				}
		}
	};

	events.on('compilationDone', onCompilationDone);
	events.on('keydown', onKeydown);
}
