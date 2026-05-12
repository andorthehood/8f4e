import { compilerSourceBlockTypes } from '@8f4e/compiler-spec';

import { getActiveCodeBlocksForEnvironmentPlugins } from '../codeBlocks';

import type { CodeBlockGraphicData, CodeError, State } from '@8f4e/editor-state-types';
import type { CompilerSourceBlockType } from '@8f4e/compiler-spec';
import type { MidiInBinding } from './types';

const diagnosticBlockTypes = new Set<string>(compilerSourceBlockTypes);

function isDiagnosticBlockType(blockType: string): blockType is CompilerSourceBlockType {
	return diagnosticBlockTypes.has(blockType);
}

export interface MidiInDirectiveParseResult {
	bindings: MidiInBinding[];
	errors: CodeError[];
}

function getCodeBlockType(block: CodeBlockGraphicData): CodeError['codeBlockType'] | undefined {
	if (isDiagnosticBlockType(block.blockType)) {
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
