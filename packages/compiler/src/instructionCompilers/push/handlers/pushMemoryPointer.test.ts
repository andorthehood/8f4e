import type { DataStructure, ResolvedMemoryPointerPushLine } from '@8f4e/compiler-spec';
import { f64load, i32const, i32load, i32load8s, i32load8u, i32load16s, i32load16u } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../../../utils/testUtils';
import pushMemoryPointer from './pushMemoryPointer';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

function createResolvedMemoryPointerPushLine(
	memoryId: string,
	memoryItem: DataStructure,
	dereferenceDepth = 1
): ResolvedMemoryPointerPushLine {
	return {
		lineNumberBeforeMacroExpansion: 1,
		lineNumberAfterMacroExpansion: 1,
		instruction: 'push',
		arguments: [classifyIdentifier(`${'*'.repeat(dereferenceDepth)}${memoryId}`)],
		resolvedTarget: { kind: 'memory-pointer', memoryItem },
	} as ResolvedMemoryPointerPushLine;
}

describe('pushMemoryPointer', () => {
	it('dereferences double pointers once and returns the inner pointer value', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 12,
						default: 0,
						isInteger: false,
						pointeeBaseType: 'float64',
						pointerDepth: 2,
						isUnsigned: false,
						type: 'float64**',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('ptr', context.namespace.memory.ptr), context);

		expect(context.byteCode).toEqual([...i32const(12), ...i32load(), ...i32load()]);
	});

	it('dereferences double pointers twice and loads target kind', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 12,
						default: 0,
						isInteger: false,
						pointeeBaseType: 'float64',
						pointerDepth: 2,
						isUnsigned: false,
						type: 'float64**',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('ptr', context.namespace.memory.ptr, 2), context);

		expect(context.byteCode).toEqual([...i32const(12), ...i32load(), ...i32load(), ...f64load()]);
	});

	it('dereferences int8* with i32load8s for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 8,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int8',
						pointerDepth: 1,
						isUnsigned: false,
						type: 'int8*',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('ptr', context.namespace.memory.ptr), context);

		expect(context.byteCode).toEqual([...i32const(8), ...i32load(), ...i32load8s()]);
	});

	it('dereferences int8u* with i32load8u for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 8,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int8u',
						pointerDepth: 1,
						isUnsigned: false,
						type: 'int8*',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('ptr', context.namespace.memory.ptr), context);

		expect(context.byteCode).toEqual([...i32const(8), ...i32load(), ...i32load8u()]);
	});

	it('dereferences int8** once without the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					pptr: {
						id: 'pptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 4,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int8',
						pointerDepth: 2,
						isUnsigned: false,
						type: 'int8**',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('pptr', context.namespace.memory.pptr), context);

		expect(context.byteCode).toEqual([...i32const(4), ...i32load(), ...i32load()]);
	});

	it('dereferences int16* with i32load16s for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 8,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int16',
						pointerDepth: 1,
						isUnsigned: false,
						type: 'int16*',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('ptr', context.namespace.memory.ptr), context);

		expect(context.byteCode).toEqual([...i32const(8), ...i32load(), ...i32load16s()]);
	});

	it('dereferences int16u* with i32load16u for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 8,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int16u',
						pointerDepth: 1,
						isUnsigned: false,
						type: 'int16*',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('ptr', context.namespace.memory.ptr), context);

		expect(context.byteCode).toEqual([...i32const(8), ...i32load(), ...i32load16u()]);
	});

	it('dereferences int16** twice with i32load16s for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					pptr: {
						id: 'pptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 4,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int16',
						pointerDepth: 2,
						isUnsigned: false,
						type: 'int16**',
					} as never,
				},
			},
		});

		pushMemoryPointer(createResolvedMemoryPointerPushLine('pptr', context.namespace.memory.pptr, 2), context);

		expect(context.byteCode).toEqual([...i32const(4), ...i32load(), ...i32load(), ...i32load16s()]);
	});
});
