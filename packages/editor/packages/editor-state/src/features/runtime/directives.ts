import { parseBlockDirectives } from '../code-blocks/utils/parseBlockDirectives';
import { resolveSelectedRuntimeId } from '../global-editor-directives/runtime/plugin';

import type { State, CodeBlock } from '~/types';
import type { RuntimeRegistryEntry } from './types';

function getSelectedRuntimeEntry(state: State): RuntimeRegistryEntry | undefined {
	if (!state.runtimeRegistry || Object.keys(state.runtimeRegistry).length === 0) {
		return undefined;
	}

	const selectedRuntimeId = resolveSelectedRuntimeId(
		state.globalEditorDirectives.runtime,
		state.runtimeRegistry,
		state.defaultRuntimeId
	);

	return state.runtimeRegistry[selectedRuntimeId] ?? state.runtimeRegistry[state.defaultRuntimeId];
}

function parseProjectCodeBlocks(codeBlocks: CodeBlock[]) {
	return codeBlocks.map((block, index) => ({
		id: index,
		parsedDirectives: parseBlockDirectives(block.code),
	}));
}

function getDirectiveBlocks(state: State) {
	if (state.graphicHelper.codeBlocks.length > 0) {
		return state.graphicHelper.codeBlocks;
	}

	return parseProjectCodeBlocks(state.initialProjectState?.codeBlocks ?? []);
}

export function resolveRuntimeDirectiveState(state: State) {
	const runtimeEntry = getSelectedRuntimeEntry(state);

	if (!runtimeEntry?.resolveRuntimeDirectives) {
		return {
			sampleRate: undefined,
			errors: [],
		};
	}

	return runtimeEntry.resolveRuntimeDirectives(getDirectiveBlocks(state), state);
}
