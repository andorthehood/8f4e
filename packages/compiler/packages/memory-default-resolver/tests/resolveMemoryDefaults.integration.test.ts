import { describe, expect, it } from 'vitest';
import { type ResolveMemoryDefaultsInput, resolveMemoryDefaults } from '../src';

describe('resolveMemoryDefaults integration', () => {
	it('resolves project-level memory defaults from pass-shaped fixtures', () => {
		const inheritedCounterLine = {
			lineNumber: 11,
			instruction: 'int',
			arguments: [
				{ type: 'identifier', value: 'inheritedCounter', referenceKind: 'plain', scope: 'local' },
				{ type: 'literal', value: 7, isInteger: true },
			],
		} as const;
		const valuesLine = {
			lineNumber: 12,
			instruction: 'int[]',
			arguments: [
				{ type: 'identifier', value: 'values', referenceKind: 'plain', scope: 'local' },
				{ type: 'literal', value: 3, isInteger: true },
				{ type: 'literal', value: 1, isInteger: true },
				{ type: 'literal', value: 2, isInteger: true },
				{ type: 'literal', value: 3, isInteger: true },
			],
		} as const;
		const valuesStartReference = {
			type: 'identifier',
			value: '&values',
			referenceKind: 'memory-reference',
			scope: 'local',
			targetMemoryId: 'values',
			isEndAddress: false,
		} as const;
		const pointerLine = {
			lineNumber: 13,
			instruction: 'int*',
			arguments: [{ type: 'identifier', value: 'ptr', referenceKind: 'plain', scope: 'local' }, valuesStartReference],
		} as const;
		const copiedCountLine = {
			lineNumber: 14,
			instruction: 'int',
			arguments: [
				{ type: 'identifier', value: 'copiedCount', referenceKind: 'plain', scope: 'local' },
				{
					type: 'identifier',
					value: 'count(audio:samples)',
					referenceKind: 'intermodular-element-count',
					scope: 'intermodule',
					targetModuleId: 'audio',
					targetMemoryId: 'samples',
				},
			],
		} as const;
		const gainLine = {
			lineNumber: 15,
			instruction: 'float',
			arguments: [
				{ type: 'identifier', value: 'gain', referenceKind: 'plain', scope: 'local' },
				{ type: 'literal', value: 1.75, isInteger: false },
			],
		} as const;
		const audioSamplesLine = {
			lineNumber: 22,
			instruction: 'int16u[]',
			arguments: [
				{ type: 'identifier', value: 'samples', referenceKind: 'plain', scope: 'local' },
				{ type: 'literal', value: 6, isInteger: true },
			],
		} as const;
		const inheritedCounterMemory = {
			numberOfElements: 1,
			elementWordSize: 4,
			memoryIndex: 0,
			byteAddress: 4,
			elementByteLength: 4,
			wordAlignedSize: 1,
			wordAlignedByteLength: 4,
			wordAlignedAddress: 1,
			endByteAddress: 4,
			endAddressSafeByteLength: 4,
			lineNumber: 11,
			isInteger: true,
			id: 'inheritedCounter',
			pointerDepth: 0,
			type: 'int',
			isUnsigned: false,
		} as const;
		const valuesMemory = {
			numberOfElements: 3,
			elementWordSize: 4,
			memoryIndex: 0,
			byteAddress: 8,
			elementByteLength: 12,
			wordAlignedSize: 3,
			wordAlignedByteLength: 12,
			wordAlignedAddress: 2,
			endByteAddress: 16,
			endAddressSafeByteLength: 4,
			lineNumber: 12,
			isInteger: true,
			id: 'values',
			pointerDepth: 0,
			type: 'int',
			isUnsigned: false,
		} as const;
		const ptrMemory = {
			numberOfElements: 1,
			elementWordSize: 4,
			memoryIndex: 0,
			byteAddress: 20,
			elementByteLength: 4,
			wordAlignedSize: 1,
			wordAlignedByteLength: 4,
			wordAlignedAddress: 5,
			endByteAddress: 20,
			endAddressSafeByteLength: 4,
			lineNumber: 13,
			isInteger: true,
			id: 'ptr',
			pointerDepth: 1,
			pointeeBaseType: 'int',
			type: 'int*',
			isUnsigned: false,
		} as const;
		const copiedCountMemory = {
			numberOfElements: 1,
			elementWordSize: 4,
			memoryIndex: 0,
			byteAddress: 24,
			elementByteLength: 4,
			wordAlignedSize: 1,
			wordAlignedByteLength: 4,
			wordAlignedAddress: 6,
			endByteAddress: 24,
			endAddressSafeByteLength: 4,
			lineNumber: 14,
			isInteger: true,
			id: 'copiedCount',
			pointerDepth: 0,
			type: 'int',
			isUnsigned: false,
		} as const;
		const gainMemory = {
			numberOfElements: 1,
			elementWordSize: 4,
			memoryIndex: 0,
			byteAddress: 28,
			elementByteLength: 4,
			wordAlignedSize: 1,
			wordAlignedByteLength: 4,
			wordAlignedAddress: 7,
			endByteAddress: 28,
			endAddressSafeByteLength: 4,
			lineNumber: 15,
			isInteger: false,
			id: 'gain',
			pointerDepth: 0,
			type: 'float',
			isUnsigned: false,
		} as const;
		const audioSamplesMemory = {
			numberOfElements: 6,
			elementWordSize: 2,
			memoryIndex: 1,
			memoryRegionName: 'audio',
			byteAddress: 4,
			elementByteLength: 12,
			wordAlignedSize: 3,
			wordAlignedByteLength: 12,
			wordAlignedAddress: 1,
			endByteAddress: 12,
			endAddressSafeByteLength: 4,
			lineNumber: 22,
			isInteger: true,
			id: 'samples',
			pointerDepth: 0,
			type: 'int16u',
			isUnsigned: true,
		} as const;
		const memoryPlan = {
			modules: {
				main: {
					id: 'main',
					lineNumber: 1,
					byteAddress: 4,
					wordAlignedSize: 7,
					wordAlignedByteLength: 28,
					endByteAddress: 28,
					endAddressSafeByteLength: 4,
					memoryIndex: 0,
					memory: {
						inheritedCounter: inheritedCounterMemory,
						values: valuesMemory,
						ptr: ptrMemory,
						copiedCount: copiedCountMemory,
						gain: gainMemory,
					},
					declarations: [inheritedCounterMemory, valuesMemory, ptrMemory, copiedCountMemory, gainMemory],
					declarationSources: [
						{ line: inheritedCounterLine, isInherited: true },
						{ line: valuesLine, isInherited: false },
						{ line: pointerLine, isInherited: false },
						{ line: copiedCountLine, isInherited: false },
						{ line: gainLine, isInherited: false },
					],
				},
				audio: {
					id: 'audio',
					lineNumber: 20,
					byteAddress: 4,
					wordAlignedSize: 3,
					wordAlignedByteLength: 12,
					endByteAddress: 12,
					endAddressSafeByteLength: 4,
					memoryIndex: 1,
					memoryRegionName: 'audio',
					memory: {
						samples: audioSamplesMemory,
					},
					declarations: [audioSamplesMemory],
					declarationSources: [{ line: audioSamplesLine, isInherited: false }],
				},
			},
			moduleList: [
				{
					id: 'main',
					lineNumber: 1,
					byteAddress: 4,
					wordAlignedSize: 7,
					wordAlignedByteLength: 28,
					endByteAddress: 28,
					endAddressSafeByteLength: 4,
					memoryIndex: 0,
					memory: {
						inheritedCounter: inheritedCounterMemory,
						values: valuesMemory,
						ptr: ptrMemory,
						copiedCount: copiedCountMemory,
						gain: gainMemory,
					},
					declarations: [inheritedCounterMemory, valuesMemory, ptrMemory, copiedCountMemory, gainMemory],
					declarationSources: [
						{ line: inheritedCounterLine, isInherited: true },
						{ line: valuesLine, isInherited: false },
						{ line: pointerLine, isInherited: false },
						{ line: copiedCountLine, isInherited: false },
						{ line: gainLine, isInherited: false },
					],
				},
				{
					id: 'audio',
					lineNumber: 20,
					byteAddress: 4,
					wordAlignedSize: 3,
					wordAlignedByteLength: 12,
					endByteAddress: 12,
					endAddressSafeByteLength: 4,
					memoryIndex: 1,
					memoryRegionName: 'audio',
					memory: {
						samples: audioSamplesMemory,
					},
					declarations: [audioSamplesMemory],
					declarationSources: [{ line: audioSamplesLine, isInherited: false }],
				},
			],
			nextByteAddressByMemoryIndex: {
				0: 32,
				1: 16,
			},
		} as const;
		const memoryReferences = {
			prototypes: [],
			modules: [],
			constants: [],
			functions: [],
			declarationSourcesByModuleId: {
				main: {
					lineFacts: [
						undefined,
						undefined,
						{
							arguments: [
								{ type: 'identifier', value: 'ptr', referenceKind: 'plain', scope: 'local' },
								{
									type: 'literal',
									value: 8,
									isInteger: true,
									address: {
										memoryIndex: 0,
										safeRange: {
											source: 'memory-start',
											memoryIndex: 0,
											byteAddress: 8,
											safeByteLength: 12,
											moduleId: 'main',
											memoryId: 'values',
										},
									},
								},
							],
						},
						{
							arguments: [
								{ type: 'identifier', value: 'copiedCount', referenceKind: 'plain', scope: 'local' },
								{ type: 'literal', value: 6, isInteger: true },
							],
						},
						undefined,
					],
				},
				audio: {
					lineFacts: [undefined],
				},
			},
			pointerMetadataByModuleId: {
				main: {
					ptr: {
						pointeeMemoryIndex: 0,
						pointeeElementCount: 3,
					},
				},
				audio: {},
			},
		} as const;

		expect(
			resolveMemoryDefaults({
				memoryPlan,
				memoryReferences,
			} satisfies ResolveMemoryDefaultsInput)
		).toMatchSnapshot();
	});
});
