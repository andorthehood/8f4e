import { describe, expect, it } from 'vitest';
import { type AnalyzeStackProjectInput, analyzeStack } from '../src';

describe('analyzeStack integration', () => {
	it('analyzes a project-level module and function report from pass-shaped fixtures', () => {
		const moduleLine = {
			lineNumber: 1,
			instruction: 'module',
			arguments: [{ type: 'identifier', value: 'main', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const bufferDeclarationLine = {
			lineNumber: 2,
			instruction: 'int[]',
			arguments: [
				{ type: 'identifier', value: 'buffer', referenceKind: 'plain', scope: 'local' },
				{ type: 'literal', value: 4, isInteger: true },
			],
		} as const;
		const moduleEndLine = {
			lineNumber: 9,
			instruction: 'moduleEnd',
			arguments: [],
		} as const;
		const functionLine = {
			lineNumber: 1,
			instruction: 'function',
			arguments: [{ type: 'identifier', value: 'increment', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const exportLine = {
			lineNumber: 2,
			instruction: '#export',
			arguments: [{ type: 'identifier', value: 'inc', referenceKind: 'plain', scope: 'local' }],
			isBlockPrologue: true,
		} as const;
		const functionEndLine = {
			lineNumber: 10,
			instruction: 'functionEnd',
			arguments: [{ type: 'identifier', value: 'int', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const bufferMemory = {
			numberOfElements: 4,
			elementWordSize: 4,
			memoryIndex: 0,
			byteAddress: 4,
			elementByteLength: 16,
			wordAlignedSize: 4,
			wordAlignedByteLength: 16,
			wordAlignedAddress: 1,
			endByteAddress: 16,
			endAddressSafeByteLength: 4,
			lineNumber: 2,
			isInteger: true,
			id: 'buffer',
			pointerDepth: 0,
			type: 'int',
			isUnsigned: false,
		} as const;
		const bufferRange = {
			source: 'memory-start',
			memoryIndex: 0,
			byteAddress: 4,
			safeByteLength: 16,
			moduleId: 'main',
			memoryId: 'buffer',
		} as const;
		expect(
			analyzeStack({
				ast: {
					modules: [
						{
							type: 'module',
							id: 'main',
							moduleLine,
							lines: [
								moduleLine,
								bufferDeclarationLine,
								{
									lineNumber: 3,
									instruction: 'push',
									arguments: [
										{
											type: 'identifier',
											value: '&buffer',
											referenceKind: 'memory-reference',
											scope: 'local',
											targetMemoryId: 'buffer',
											isEndAddress: false,
										},
									],
								},
								{
									lineNumber: 4,
									instruction: 'clampAddress',
									arguments: [{ type: 'literal', value: 4, isInteger: true }],
								},
								{ lineNumber: 5, instruction: 'drop', arguments: [] },
								{
									lineNumber: 6,
									instruction: 'push',
									arguments: [{ type: 'literal', value: 5, isInteger: true }],
								},
								{
									lineNumber: 7,
									instruction: 'call',
									arguments: [{ type: 'identifier', value: 'increment', referenceKind: 'plain', scope: 'local' }],
								},
								{ lineNumber: 8, instruction: 'drop', arguments: [] },
								moduleEndLine,
							],
						},
					],
					functions: [
						{
							type: 'function',
							name: 'increment',
							functionLine,
							functionEndLine,
							exportLine,
							lines: [
								functionLine,
								exportLine,
								{
									lineNumber: 3,
									instruction: 'param',
									arguments: [
										{ type: 'identifier', value: 'int', referenceKind: 'plain', scope: 'local' },
										{ type: 'identifier', value: 'value', referenceKind: 'plain', scope: 'local' },
									],
								},
								{
									lineNumber: 4,
									instruction: 'local',
									arguments: [
										{ type: 'identifier', value: 'int', referenceKind: 'plain', scope: 'local' },
										{ type: 'identifier', value: 'temp', referenceKind: 'plain', scope: 'local' },
									],
								},
								{
									lineNumber: 5,
									instruction: 'push',
									arguments: [{ type: 'identifier', value: 'value', referenceKind: 'plain', scope: 'local' }],
								},
								{
									lineNumber: 6,
									instruction: 'push',
									arguments: [{ type: 'literal', value: 1, isInteger: true }],
								},
								{ lineNumber: 7, instruction: 'add', arguments: [] },
								{
									lineNumber: 8,
									instruction: 'localSet',
									arguments: [{ type: 'identifier', value: 'temp', referenceKind: 'plain', scope: 'local' }],
								},
								{
									lineNumber: 9,
									instruction: 'push',
									arguments: [{ type: 'identifier', value: 'temp', referenceKind: 'plain', scope: 'local' }],
								},
								functionEndLine,
							],
						},
					],
				},
				semanticReferences: {
					modules: {
						main: {
							lineFacts: [
								undefined,
								undefined,
								{
									arguments: [
										{
											type: 'literal',
											value: 4,
											isInteger: true,
											address: {
												memoryIndex: 0,
												safeRange: bufferRange,
											},
										},
									],
								},
								undefined,
								undefined,
								undefined,
								undefined,
								undefined,
								undefined,
							],
						},
					},
					functions: {
						increment__int: {
							functionId: 'increment__int',
							lineFacts: [
								undefined,
								undefined,
								undefined,
								undefined,
								{
									resolvedTarget: {
										kind: 'local',
										localName: 'value',
									},
								},
								undefined,
								undefined,
								undefined,
								{
									resolvedTarget: {
										kind: 'local',
										localName: 'temp',
									},
								},
								undefined,
							],
						},
					},
				},
				namespaces: {
					main: {
						kind: 'module',
						memoryIndex: 0,
						byteAddress: 4,
						wordAlignedSize: 4,
						memoryDefaults: {
							buffer: {
								value: 0,
								hasExplicitDefault: false,
								isInherited: false,
							},
						},
						pointerMetadata: {},
					},
				},
				memoryPlan: {
					modules: {
						main: {
							id: 'main',
							lineNumber: 1,
							byteAddress: 4,
							wordAlignedSize: 4,
							wordAlignedByteLength: 16,
							endByteAddress: 16,
							endAddressSafeByteLength: 4,
							memoryIndex: 0,
							memory: {
								buffer: bufferMemory,
							},
							declarations: [bufferMemory],
							declarationSources: [
								{
									line: bufferDeclarationLine,
									isInherited: false,
								},
							],
						},
					},
					moduleList: [
						{
							id: 'main',
							lineNumber: 1,
							byteAddress: 4,
							wordAlignedSize: 4,
							wordAlignedByteLength: 16,
							endByteAddress: 16,
							endAddressSafeByteLength: 4,
							memoryIndex: 0,
							memory: {
								buffer: bufferMemory,
							},
							declarations: [bufferMemory],
							declarationSources: [
								{
									line: bufferDeclarationLine,
									isInherited: false,
								},
							],
						},
					],
					nextByteAddressByMemoryIndex: {
						0: 20,
					},
				},
				memoryDefaultsByModuleId: {
					main: {
						buffer: {
							value: 0,
							hasExplicitDefault: false,
							isInherited: false,
						},
					},
				},
				pointerMetadataByModuleId: {
					main: {},
				},
				functions: {
					byId: {
						increment__int: {
							id: 'increment__int',
							name: 'increment',
							signature: {
								parameters: ['int'],
								returns: ['int'],
							},
							wasmIndex: 2,
						},
					},
					arityByName: {
						increment: 1,
					},
				},
				functionTypeRegistry: {
					types: [],
					signatures: [],
					baseTypeIndex: 3,
				},
				memoryRegions: [],
				prototypeShapes: {},
			} as unknown as AnalyzeStackProjectInput)
		).toMatchSnapshot();
	});
});
