import { describe, expect, it } from 'vitest';

import { compileSegment } from './compiler';
import createInstructionCompilerTestContext from './utils/testUtils';

describe('compileSegment', () => {
	it('keeps address metadata when adding a constant in-range byte offset', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				memory: {
					arr: {
						id: 'arr',
						numberOfElements: 32,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 32,
						byteAddress: 0,
						default: 0,
						isInteger: true,
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int',
					},
				},
				consts: { OFFSET: { value: 4, isInteger: true } },
			} as never,
		});

		compileSegment(['push &arr', 'push OFFSET', 'add'], context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 4,
				memoryAddress: { source: 'memory-start', byteAddress: 4, safeByteLength: 124, memoryId: 'arr' },
				memoryAddressRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
			},
		]);
	});

	it('keeps address metadata when adding a computed in-range byte offset', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				memory: {
					arr: {
						id: 'arr',
						numberOfElements: 16,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 16,
						byteAddress: 0,
						default: 0,
						isInteger: true,
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int',
					},
				},
				consts: {},
			} as never,
		});

		compileSegment(['push &arr', 'push 2', 'push sizeof(arr)', 'mul', 'add'], context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 8,
				memoryAddress: { source: 'memory-start', byteAddress: 8, safeByteLength: 56, memoryId: 'arr' },
				memoryAddressRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 64, memoryId: 'arr' },
			},
		]);
	});

	it('keeps address metadata when pushing an address expression with an in-range offset', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				memory: {
					arr: {
						id: 'arr',
						numberOfElements: 32,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 32,
						byteAddress: 0,
						default: 0,
						isInteger: true,
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int',
					},
				},
				consts: {},
			} as never,
		});

		compileSegment(['push &arr+4'], context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 4,
				memoryAddress: { source: 'memory-start', byteAddress: 4, safeByteLength: 124, memoryId: 'arr' },
				memoryAddressRange: { source: 'memory-start', byteAddress: 4, safeByteLength: 124, memoryId: 'arr' },
			},
		]);
	});

	it('accepts sizeof expressions as clamp access-width arguments', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				memory: {
					bytes: {
						id: 'bytes',
						numberOfElements: 16,
						elementWordSize: 1,
						wordAlignedAddress: 0,
						wordAlignedSize: 4,
						byteAddress: 0,
						default: 0,
						isInteger: true,
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int',
					},
				},
				consts: {},
			} as never,
		});

		compileSegment(['push &bytes', 'push 1024', 'add', 'clampAddress sizeof(bytes)'], context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 15,
				memoryAddressRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 16, memoryId: 'bytes' },
				safeMemoryAccessByteWidth: 1,
			},
		]);
	});
});
