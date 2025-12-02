import { StateManager } from '@8f4e/state-manager';

import { backSpace, enter, moveCaret, type } from '../../helpers/editor';
import { EventDispatcher, InternalKeyboardEvent, State } from '../../types';

export default function codeEditing(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();

	const onKeydown = function (event: InternalKeyboardEvent) {
		if (event.metaKey) {
			return;
		}

		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}

		const codeBlock = state.graphicHelper.selectedCodeBlock;

		let newPosition: [number, number] = [codeBlock.cursor.row, codeBlock.cursor.col];

		switch (event.key) {
			case undefined:
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'ArrowRight':
			case 'ArrowDown':
				newPosition = moveCaret(codeBlock.code, codeBlock.cursor.row, codeBlock.cursor.col, event.key);
				store.set('graphicHelper.selectedCodeBlock.cursor.row', newPosition[0]);
				store.set('graphicHelper.selectedCodeBlock.cursor.col', newPosition[1]);

				break;
			case 'Backspace':
				if (!state.featureFlags.editing) {
					return;
				}
				// eslint-disable-next-line no-case-declarations
				const bp = backSpace(codeBlock.code, codeBlock.cursor.row, codeBlock.cursor.col);
				store.set('graphicHelper.selectedCodeBlock.cursor.row', bp.row);
				store.set('graphicHelper.selectedCodeBlock.cursor.col', bp.col);
				store.set('graphicHelper.selectedCodeBlock.code', bp.code);
				store.set('graphicHelper.selectedCodeBlock.lastUpdated', Date.now());
				break;
			case 'Enter':
				if (!state.featureFlags.editing) {
					return;
				}
				// eslint-disable-next-line no-case-declarations
				const ent = enter(codeBlock.code, codeBlock.cursor.row, codeBlock.cursor.col);
				store.set('graphicHelper.selectedCodeBlock.cursor.row', ent.row);
				store.set('graphicHelper.selectedCodeBlock.cursor.col', ent.col);
				store.set('graphicHelper.selectedCodeBlock.code', ent.code);
				store.set('graphicHelper.selectedCodeBlock.lastUpdated', Date.now());
				break;
			default:
				if (event?.key.length === 1) {
					if (!state.featureFlags.editing) {
						return;
					}
					// eslint-disable-next-line no-case-declarations
					const bp = type(codeBlock.code, codeBlock.cursor.row, codeBlock.cursor.col, event.key);
					store.set('graphicHelper.selectedCodeBlock.cursor.row', bp.row);
					store.set('graphicHelper.selectedCodeBlock.cursor.col', bp.col);
					store.set('graphicHelper.selectedCodeBlock.code', bp.code);
					store.set('graphicHelper.selectedCodeBlock.lastUpdated', Date.now());
				}
		}
	};

	events.on<InternalKeyboardEvent>('keydown', onKeydown);
}
