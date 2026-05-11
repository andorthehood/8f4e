import { getActiveCodeBlocksForEnvironmentPlugins } from '../codeBlocks';

import type { CodeBlockGraphicData, CodeError, State } from '@8f4e/editor-state-types';
import type { MidiInBinding } from './types';

export interface MidiInDirectiveParseResult {
	bindings: MidiInBinding[];
	errors: CodeError[];
}

function getCodeBlockType(block: CodeBlockGraphicData): CodeError['codeBlockType'] | undefined {
	if (block.blockType === 'module' || block.blockType === 'function' || block.blockType === 'constants') {
		return block.blockType;
	}

	return undefined;
}

function createDirectiveError(block: CodeBlockGraphicData, rawRow: number, message: string): CodeError {
	return {
		codeBlockId: block.id,
		codeBlockType: getCodeBlockType(block),
		lineNumber: rawRow + 1,
		message,
	};
}

export default function parseMidiInDirectives(state: State): MidiInDirectiveParseResult {
	const bindings: MidiInBinding[] = [];
	const errors: CodeError[] = [];
	const seenBindings = new Set<string>();

	for (const block of getActiveCodeBlocksForEnvironmentPlugins(state)) {
		for (const directive of block.parsedDirectives ?? []) {
			if (directive.prefix !== '@' || directive.name !== 'midiIn') {
				continue;
			}

			const [port, exportName, extraArg] = directive.args;
			if (!port || !exportName || extraArg) {
				errors.push(createDirectiveError(block, directive.rawRow, '@midiIn requires <port> and <callbackExportName>.'));
				continue;
			}

			if (!Number.isInteger(Number(port)) || Number(port) < 0) {
				errors.push(createDirectiveError(block, directive.rawRow, '@midiIn port must be a non-negative number.'));
				continue;
			}

			const bindingKey = `${port}\u0000${exportName}`;
			if (seenBindings.has(bindingKey)) {
				errors.push(
					createDirectiveError(
						block,
						directive.rawRow,
						`Duplicate @midiIn binding for port "${port}" and callback "${exportName}".`
					)
				);
				continue;
			}

			seenBindings.add(bindingKey);
			bindings.push({
				port,
				exportName,
				lineNumber: directive.rawRow + 1,
				codeBlockId: block.id,
				codeBlockType: getCodeBlockType(block),
			});
		}
	}

	return { bindings, errors };
}
