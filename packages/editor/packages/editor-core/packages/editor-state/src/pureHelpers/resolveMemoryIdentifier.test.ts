import type { PlannedMemoryDeclaration } from '@8f4e/language-spec';
import { MemoryTypes } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import resolveMemoryIdentifier from './resolveMemoryIdentifier';
import { createMockState } from './testingUtils/testUtils';

describe('resolveMemoryIdentifier', () => {
	it('resolves intermodule references relative to the current project path', () => {
		const state = createMockState();
		const memory: PlannedMemoryDeclaration = {
			id: 'value',
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			memoryIndex: 0,
			byteAddress: 16,
			wordAlignedAddress: 4,
			wordAlignedSize: 1,
			lineNumber: 1,
			isInteger: true,
			pointerDepth: 0,
			isUnsigned: false,
		};
		state.compiler.memoryPlan.modules['audio/source'] = {
			id: 'audio/source',
			lineNumber: 0,
			memoryIndex: 0,
			byteAddress: 16,
			wordAlignedSize: 1,
			wordAlignedByteLength: 4,
			endByteAddress: 20,
			endAddressSafeByteLength: 0,
			memory: { value: memory },
			declarations: [memory],
			declarationSources: [],
		};

		expect(resolveMemoryIdentifier(state, 'audio/consumer', 'source:value')?.memory).toBe(memory);
		expect(resolveMemoryIdentifier(state, '', 'audio/source:value')?.memory).toBe(memory);
	});
});
