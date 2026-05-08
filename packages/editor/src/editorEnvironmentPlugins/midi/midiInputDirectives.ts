import type { CodeBlockGraphicData, CodeError, State } from '@8f4e/editor-state-types';
import type { DataStructure } from '@8f4e/compiler-types';

export const MIDI_INPUT_RECORD_WORDS = 5;

export interface MidiInputBinding {
	portId: string;
	codeBlockId: string | number;
	lineNumber: number;
	bufferWordAddress: number;
	readIndexWordAddress: number;
	writeIndexWordAddress: number;
	droppedWordAddress: number;
	capacity: number;
}

interface ActiveCodeBlock extends Partial<CodeBlockGraphicData> {
	id?: string;
}

function getActiveCodeBlocks(state: State): ActiveCodeBlock[] {
	const blocksById = new Map<string, ActiveCodeBlock>();
	const anonymousBlocks: ActiveCodeBlock[] = [];

	for (const block of state.graphicHelper.codeBlocks ?? []) {
		if (block.id) {
			blocksById.set(block.id, block);
		} else {
			anonymousBlocks.push(block);
		}
	}

	const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;
	if (selectedCodeBlock) {
		if (selectedCodeBlock.id) {
			blocksById.set(selectedCodeBlock.id, selectedCodeBlock);
		} else {
			anonymousBlocks.push(selectedCodeBlock);
		}
	}

	return [...anonymousBlocks, ...blocksById.values()];
}

function createError(block: ActiveCodeBlock, lineNumber: number, message: string): CodeError {
	return {
		codeBlockId: block.id ?? 'midi',
		lineNumber,
		message,
	};
}

function isIntegerScalar(memory: DataStructure | undefined): boolean {
	return Boolean(
		memory &&
		memory.isInteger &&
		memory.numberOfElements === 1 &&
		memory.elementWordSize === 4 &&
		memory.pointeeBaseType === undefined
	);
}

function isIntegerArray(memory: DataStructure | undefined): boolean {
	return Boolean(
		memory &&
		memory.isInteger &&
		memory.numberOfElements > 1 &&
		memory.elementWordSize === 4 &&
		memory.pointeeBaseType === undefined
	);
}

export function resolveMidiInputBindings(state: State): { bindings: MidiInputBinding[]; errors: CodeError[] } {
	const bindings: MidiInputBinding[] = [];
	const errors: CodeError[] = [];
	const seenTargets = new Set<string>();

	for (const block of getActiveCodeBlocks(state)) {
		for (const directive of block.parsedDirectives ?? []) {
			if (directive.prefix !== '@' || directive.name !== 'midiInput') {
				continue;
			}

			if (block.blockType !== 'module' || !block.moduleId) {
				errors.push(createError(block, directive.rawRow, '@midiInput can only be used inside a module block'));
				continue;
			}

			if (directive.args.length !== 5) {
				errors.push(
					createError(
						block,
						directive.rawRow,
						'@midiInput requires arguments: <portId> <buffer> <readIndex> <writeIndex> <dropped>'
					)
				);
				continue;
			}

			const [portId, bufferName, readIndexName, writeIndexName, droppedName] = directive.args;
			const compiledModule = state.compiler.compiledModules[block.moduleId];
			if (!compiledModule) {
				errors.push(createError(block, directive.rawRow, `@midiInput: module '${block.moduleId}' is not compiled`));
				continue;
			}

			const buffer = compiledModule.memoryMap[bufferName];
			const readIndex = compiledModule.memoryMap[readIndexName];
			const writeIndex = compiledModule.memoryMap[writeIndexName];
			const dropped = compiledModule.memoryMap[droppedName];

			if (!isIntegerArray(buffer)) {
				errors.push(createError(block, directive.rawRow, `@midiInput: '${bufferName}' must be an int array`));
				continue;
			}
			if (!isIntegerScalar(readIndex)) {
				errors.push(createError(block, directive.rawRow, `@midiInput: '${readIndexName}' must be an int scalar`));
				continue;
			}
			if (!isIntegerScalar(writeIndex)) {
				errors.push(createError(block, directive.rawRow, `@midiInput: '${writeIndexName}' must be an int scalar`));
				continue;
			}
			if (!isIntegerScalar(dropped)) {
				errors.push(createError(block, directive.rawRow, `@midiInput: '${droppedName}' must be an int scalar`));
				continue;
			}
			if (buffer.numberOfElements % MIDI_INPUT_RECORD_WORDS !== 0) {
				errors.push(
					createError(
						block,
						directive.rawRow,
						`@midiInput: '${bufferName}' length must be divisible by ${MIDI_INPUT_RECORD_WORDS}`
					)
				);
				continue;
			}

			const capacity = buffer.numberOfElements / MIDI_INPUT_RECORD_WORDS;
			if (capacity < 2) {
				errors.push(createError(block, directive.rawRow, `@midiInput: '${bufferName}' capacity must be at least 2`));
				continue;
			}

			const targetId = [
				block.moduleId,
				buffer.wordAlignedAddress,
				readIndex.wordAlignedAddress,
				writeIndex.wordAlignedAddress,
				dropped.wordAlignedAddress,
			].join(':');
			if (seenTargets.has(targetId)) {
				errors.push(createError(block, directive.rawRow, '@midiInput: duplicate SPSC buffer target'));
				continue;
			}
			seenTargets.add(targetId);

			bindings.push({
				portId,
				codeBlockId: block.id ?? block.moduleId,
				lineNumber: directive.rawRow,
				bufferWordAddress: buffer.wordAlignedAddress,
				readIndexWordAddress: readIndex.wordAlignedAddress,
				writeIndexWordAddress: writeIndex.wordAlignedAddress,
				droppedWordAddress: dropped.wordAlignedAddress,
				capacity,
			});
		}
	}

	return { bindings, errors };
}
