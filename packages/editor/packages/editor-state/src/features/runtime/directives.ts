import { resolveSelectedRuntimeId } from './editorConfig';

import { parseBlockDirectives } from '../code-blocks/utils/parseBlockDirectives';

import type { State, CodeBlock } from '@8f4e/editor-state-types';
import type { RuntimeRegistryEntry } from '@8f4e/editor-state-types';

function getSelectedRuntimeEntry(state: State): RuntimeRegistryEntry | undefined {
	if (!state.runtimeRegistry || Object.keys(state.runtimeRegistry).length === 0) {
		return undefined;
	}

	const selectedRuntimeId = resolveSelectedRuntimeId(
		state.editorConfig.runtime,
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

	return runtimeEntry.resolveRuntimeDirectives(getDirectiveBlocks(state));
}

export function resolveRuntimeEnvConstants(state: State): string[] {
	const runtimeEntry = getSelectedRuntimeEntry(state);

	if (!runtimeEntry?.getEnvConstants) {
		return [];
	}

	return runtimeEntry.getEnvConstants(getDirectiveBlocks(state));
}
