import type { CodeBlockGraphicData, CodeError } from '@8f4e/editor';
import type { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler-types';
import type { MidiCCModuleAddresses, MidiModuleAddresses } from './types';

interface MidiNoteRoute {
	moduleId: string;
	channelMemoryId?: string;
	portMemoryId?: string;
	velocityMemoryId?: string;
	noteOnOffMemoryId: string;
	noteMemoryId: string;
}

interface MidiCCRoute {
	moduleId: string;
	channelMemoryId?: string;
	selectedCCMemoryId: string;
	valueMemoryId: string;
}

export interface MidiDirectiveResolution {
	noteInputs: MidiNoteRoute[];
	noteOutputs: MidiNoteRoute[];
	ccInputs: MidiCCRoute[];
	ccOutputs: MidiCCRoute[];
	errors: CodeError[];
}

function createError(codeBlockId: string | number, lineNumber: number, message: string): CodeError {
	return { codeBlockId, lineNumber, message };
}

function getArgs(directiveArgs: string[], requiredCount: number): string[] | undefined {
	if (directiveArgs.length < requiredCount) {
		return undefined;
	}

	const values = directiveArgs.slice(0, Math.max(requiredCount, directiveArgs.length));
	if (values.some(value => !value)) {
		return undefined;
	}

	return values;
}

export function resolveMidiRouting(codeBlocks: CodeBlockGraphicData[]): MidiDirectiveResolution {
	const noteInputs: MidiNoteRoute[] = [];
	const noteOutputs: MidiNoteRoute[] = [];
	const ccInputs: MidiCCRoute[] = [];
	const ccOutputs: MidiCCRoute[] = [];
	const errors: CodeError[] = [];

	for (const block of codeBlocks) {
		const midiDirectives = block.parsedDirectives.filter(
			directive =>
				directive.prefix === '~' &&
				['midiNoteInput', 'midiNoteOutput', 'midiCCInput', 'midiCCOutput'].includes(directive.name)
		);

		for (const directive of midiDirectives) {
			if (block.blockType !== 'module' || !block.moduleId) {
				errors.push(
					createError(block.id, directive.rawRow, `~${directive.name} can only be used inside a module block`)
				);
				continue;
			}

			if (directive.name === 'midiNoteInput' || directive.name === 'midiNoteOutput') {
				const values = getArgs(directive.args, 2);
				if (!values) {
					errors.push(
						createError(
							block.id,
							directive.rawRow,
							`~${directive.name} requires <gateMem> <noteMem> [channelMem] [velocityMem] [portMem]`
						)
					);
					continue;
				}

				const [noteOnOffMemoryId, noteMemoryId, channelMemoryId, velocityMemoryId, portMemoryId] = values;
				const route: MidiNoteRoute = {
					moduleId: block.moduleId,
					noteOnOffMemoryId,
					noteMemoryId,
					...(channelMemoryId ? { channelMemoryId } : {}),
					...(velocityMemoryId ? { velocityMemoryId } : {}),
					...(portMemoryId ? { portMemoryId } : {}),
				};

				if (directive.name === 'midiNoteInput') {
					noteInputs.push(route);
				} else {
					noteOutputs.push(route);
				}
				continue;
			}

			const values = getArgs(directive.args, 2);
			if (!values) {
				errors.push(
					createError(block.id, directive.rawRow, `~${directive.name} requires <selectedCCMem> <valueMem> [channelMem]`)
				);
				continue;
			}

			const [selectedCCMemoryId, valueMemoryId, channelMemoryId] = values;
			const route: MidiCCRoute = {
				moduleId: block.moduleId,
				selectedCCMemoryId,
				valueMemoryId,
				...(channelMemoryId ? { channelMemoryId } : {}),
			};

			if (directive.name === 'midiCCInput') {
				ccInputs.push(route);
			} else {
				ccOutputs.push(route);
			}
		}
	}

	return { noteInputs, noteOutputs, ccInputs, ccOutputs, errors };
}

function resolveWordAddress(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer,
	moduleId: string,
	memoryId: string | undefined
): number | undefined {
	if (!memoryId) {
		return undefined;
	}

	const memory = compiledModules[moduleId]?.memoryMap[memoryId];
	if (!memory) {
		return undefined;
	}

	if (memory.pointeeBaseType) {
		return memoryBuffer[memory.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT;
	}

	return memory.wordAlignedAddress;
}

export function resolveMidiNoteRoutesToAddresses(
	routes: MidiNoteRoute[],
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): MidiModuleAddresses[] {
	return routes.map(route => ({
		moduleId: route.moduleId,
		channelWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.channelMemoryId),
		portWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.portMemoryId),
		velocityWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.velocityMemoryId),
		noteOnOffWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.noteOnOffMemoryId),
		noteWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.noteMemoryId),
	}));
}

export function resolveMidiCCRoutesToAddresses(
	routes: MidiCCRoute[],
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): MidiCCModuleAddresses[] {
	return routes.map(route => ({
		moduleId: route.moduleId,
		channelWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.channelMemoryId),
		selectedCCWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.selectedCCMemoryId),
		valueWordAddress: resolveWordAddress(compiledModules, memoryBuffer, route.moduleId, route.valueMemoryId),
	}));
}

export function createMidiCCInputLookup(
	modules: MidiCCModuleAddresses[],
	memoryBuffer: MemoryBuffer
): Map<string, MidiCCModuleAddresses> {
	return new Map(
		modules
			.filter(module => typeof module.selectedCCWordAddress !== 'undefined')
			.map(module => {
				const channel =
					typeof module.channelWordAddress !== 'undefined' ? memoryBuffer[module.channelWordAddress] || 1 : 1;
				const cc = memoryBuffer[module.selectedCCWordAddress!];
				return [`${channel}:${cc}`, module];
			})
	);
}
