import { serializeGroupToClipboard } from '../../clipboard/clipboardUtils';

import type { StateManager } from '@8f4e/state-manager';
import type { CodeBlockGraphicData, State, EventDispatcher } from '~/types';

export default function groupCopier(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onCopyGroupBlocks({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		// Use callback if available, otherwise fail silently
		if (!state.callbacks.writeClipboardText) {
			return;
		}

		const groupName = codeBlock.groupName;
		if (!groupName) {
			// No group name, fallback to single copy
			onCopyCodeBlock({ codeBlock });
			return;
		}

		// Get all blocks in the group
		const groupBlocks = state.graphicHelper.codeBlocks.filter(block => block.groupName === groupName);

		// Sort by creation index to maintain deterministic order
		const sortedBlocks = [...groupBlocks].sort((a, b) => a.creationIndex - b.creationIndex);

		// Serialize to clipboard using the selected block as anchor
		const clipboardData = serializeGroupToClipboard(sortedBlocks, codeBlock);

		state.callbacks.writeClipboardText(clipboardData).catch(() => {
			// Fail silently if clipboard write fails
			return undefined;
		});
	}

	function onCopyCodeBlock({ codeBlock }: { codeBlock: CodeBlockGraphicData }): void {
		// Use callback if available, otherwise fail silently
		if (state.callbacks.writeClipboardText) {
			state.callbacks.writeClipboardText(codeBlock.code.join('\n')).catch(() => {
				// Fail silently if clipboard write fails
				return undefined;
			});
		}
	}

	events.on('copyGroupBlocks', onCopyGroupBlocks);
}
