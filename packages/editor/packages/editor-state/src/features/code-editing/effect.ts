import { StateManager } from '@8f4e/state-manager';

import backSpace from './backSpace';
import enter from './enter';
import { moveCaret } from './moveCaret';
import type from './type';

import { EventDispatcher, MoveCaretEvent, InsertTextEvent, State } from '~/types';

export default function codeEditing(store: StateManager<State>, events: EventDispatcher) {
	const state = store.getState();

	const onMoveCaret = function (event: MoveCaretEvent) {
		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}

		const codeBlock = state.graphicHelper.selectedCodeBlock;

		const newPosition: [number, number] = moveCaret(
			codeBlock.code,
			codeBlock.cursor.row,
			codeBlock.cursor.col,
			event.direction
		);
		store.set('graphicHelper.selectedCodeBlock.cursor.row', newPosition[0]);
		store.set('graphicHelper.selectedCodeBlock.cursor.col', newPosition[1]);
	};

	const onDeleteBackward = function () {
		if (!state.featureFlags.editing) {
			return;
		}

		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}

		const codeBlock = state.graphicHelper.selectedCodeBlock;
		const bp = backSpace(codeBlock.code, codeBlock.cursor.row, codeBlock.cursor.col);
		store.set('graphicHelper.selectedCodeBlock.cursor.row', bp.row);
		store.set('graphicHelper.selectedCodeBlock.cursor.col', bp.col);
		store.set('graphicHelper.selectedCodeBlock.code', bp.code);
		store.set('graphicHelper.selectedCodeBlock.lastUpdated', Date.now());
	};

	const onInsertNewLine = function () {
		if (!state.featureFlags.editing) {
			return;
		}

		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}

		const codeBlock = state.graphicHelper.selectedCodeBlock;
		const ent = enter(codeBlock.code, codeBlock.cursor.row, codeBlock.cursor.col);
		store.set('graphicHelper.selectedCodeBlock.cursor.row', ent.row);
		store.set('graphicHelper.selectedCodeBlock.cursor.col', ent.col);
		store.set('graphicHelper.selectedCodeBlock.code', ent.code);
		store.set('graphicHelper.selectedCodeBlock.lastUpdated', Date.now());
	};

	const onInsertText = function (event: InsertTextEvent) {
		if (!state.featureFlags.editing) {
			return;
		}

		if (!state.graphicHelper.selectedCodeBlock) {
			return;
		}

		const codeBlock = state.graphicHelper.selectedCodeBlock;
		const bp = type(codeBlock.code, codeBlock.cursor.row, codeBlock.cursor.col, event.text);
		store.set('graphicHelper.selectedCodeBlock.cursor.row', bp.row);
		store.set('graphicHelper.selectedCodeBlock.cursor.col', bp.col);
		store.set('graphicHelper.selectedCodeBlock.code', bp.code);
		store.set('graphicHelper.selectedCodeBlock.lastUpdated', Date.now());
	};

	events.on<MoveCaretEvent>('moveCaret', onMoveCaret);
	events.on('deleteBackward', onDeleteBackward);
	events.on('insertNewLine', onInsertNewLine);
	events.on<InsertTextEvent>('insertText', onInsertText);
}
