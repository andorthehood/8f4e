import type { CompiledModuleLookup } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import didProgramOrMemoryStructureChange from '../didProgramOrMemoryStructureChange';

function createCompiledModules(
	overrides: { moduleByteAddress?: number; memoryByteAddress?: number; defaultValue?: number } = {}
): CompiledModuleLookup {
	const moduleByteAddress = overrides.moduleByteAddress ?? 4;
	const memoryByteAddress = overrides.memoryByteAddress ?? moduleByteAddress;

	return {
		alpha: {
			id: 'alpha',
			index: 0,
			cycleFunction: [1, 2, 3],
			initFunctionBody: [],
			memoryIndex: 0,
			byteAddress: moduleByteAddress,
			wordAlignedAddress: moduleByteAddress / 4,
			wordAlignedSize: 1,
			ast: undefined,
			memoryMap: {
				value: {
					id: 'value',
					numberOfElements: 1,
					elementWordSize: 4,
					type: 'int',
					memoryIndex: 0,
					byteAddress: memoryByteAddress,
					wordAlignedSize: 1,
					wordAlignedAddress: memoryByteAddress / 4,
					default: overrides.defaultValue ?? 1,
					isInherited: false,
					lineNumber: 1,
					isInteger: true,
					pointerDepth: 0,
					isUnsigned: false,
				},
			},
		},
	} as unknown as CompiledModuleLookup;
}

describe('didProgramOrMemoryStructureChange', () => {
	it('treats module address movement as a memory structure change', () => {
		const previous = createCompiledModules({ moduleByteAddress: 4 });
		const current = createCompiledModules({ moduleByteAddress: 8, memoryByteAddress: 8 });

		expect(didProgramOrMemoryStructureChange(current, previous)).toBe(true);
	});

	it('treats memory item address movement as a memory structure change', () => {
		const previous = createCompiledModules({ memoryByteAddress: 4 });
		const current = createCompiledModules({ memoryByteAddress: 8 });

		expect(didProgramOrMemoryStructureChange(current, previous)).toBe(true);
	});

	it('ignores default-only changes so existing memory can be patched', () => {
		const previous = createCompiledModules({ defaultValue: 1 });
		const current = createCompiledModules({ defaultValue: 2 });

		expect(didProgramOrMemoryStructureChange(current, previous)).toBe(false);
	});
});
