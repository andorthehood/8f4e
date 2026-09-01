import type { PlannedMemoryDeclaration, PlannedMemoryModule } from '@8f4e/language-spec';
import { MemoryTypes } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import resolveMemoryIdentifier from './resolveMemoryIdentifier';
import { createMockState } from './testingUtils/testUtils';

function createMemory(
	id: string,
	byteAddress: number,
	overrides: Partial<PlannedMemoryDeclaration> = {}
): PlannedMemoryDeclaration {
	return {
		id,
		numberOfElements: 1,
		elementWordSize: 4,
		elementByteLength: 4,
		type: MemoryTypes.int,
		memoryIndex: 0,
		byteAddress,
		wordAlignedAddress: byteAddress / 4,
		wordAlignedSize: 1,
		wordAlignedByteLength: 4,
		endByteAddress: byteAddress,
		endAddressSafeByteLength: 4,
		lineNumber: 1,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

function createModule(id: string, declarations: PlannedMemoryDeclaration[]): PlannedMemoryModule {
	return {
		id,
		lineNumber: 0,
		memoryIndex: declarations[0]?.memoryIndex ?? 0,
		byteAddress: declarations[0]?.byteAddress ?? 0,
		wordAlignedSize: declarations.reduce((size, declaration) => size + declaration.wordAlignedSize, 0),
		wordAlignedByteLength: declarations.reduce((size, declaration) => size + declaration.wordAlignedByteLength, 0),
		endByteAddress: declarations.at(-1)?.endByteAddress ?? 0,
		endAddressSafeByteLength: declarations.at(-1)?.endAddressSafeByteLength ?? 0,
		memory: Object.fromEntries(declarations.map(declaration => [declaration.id, declaration])),
		declarations,
		declarationSources: [],
	};
}

describe('resolveMemoryIdentifier', () => {
	it('resolves intermodule references relative to the current project path', () => {
		const state = createMockState();
		const memory = createMemory('value', 16);
		state.compiler.memoryPlan.modules['audio/source'] = createModule('audio/source', [memory]);

		expect(resolveMemoryIdentifier(state, 'audio/consumer', 'source:value')?.memory).toBe(memory);
		expect(resolveMemoryIdentifier(state, '', 'audio/source:value')?.memory).toBe(memory);
	});

	it('resolves a dereferenced pointer from the memory plan without rendered outputs', () => {
		const state = createMockState();
		const pointer = createMemory('pointer', 4, {
			type: MemoryTypes['int*'],
			pointeeBaseType: 'int',
			pointerDepth: 1,
		});
		const pointee = createMemory('value', 40);
		const watcherModule = createModule('watcher', [pointer]);
		const pointeeModule = createModule('pointee', [pointee]);
		state.compiler.memoryPlan.modules = { watcher: watcherModule, pointee: pointeeModule };
		state.compiler.memoryPlan.moduleList = [watcherModule, pointeeModule];
		state.compiler.pointerMetadataByModuleId.watcher = {
			pointer: { pointeeMemoryIndex: pointee.memoryIndex },
		};
		state.callbacks.getWordFromMemory = () => pointee.byteAddress;

		expect(state.codeBlockRendering.outputsByWordAddress.size).toBe(0);
		expect(resolveMemoryIdentifier(state, 'watcher', '*pointer')?.memory).toBe(pointee);
	});
});
