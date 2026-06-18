import type { ConstantsAST, FunctionAST, ModuleAST, PrototypeAST } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { type ResolveSemanticReferencesInput, resolveSemanticReferences } from '../src';

type SemanticReferenceResolverIntegrationInput = ResolveSemanticReferencesInput<
	PrototypeAST,
	ModuleAST,
	ConstantsAST,
	FunctionAST
>;

describe('resolveSemanticReferences integration', () => {
	it('resolves project-level semantic references from pass-shaped fixtures', () => {
		const prototypeLine = {
			lineNumber: 1,
			instruction: 'prototype',
			arguments: [{ type: 'identifier', value: 'state', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const valueDeclarationLine = {
			lineNumber: 2,
			instruction: 'int',
			arguments: [{ type: 'identifier', value: 'value', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const prototypeEndLine = {
			lineNumber: 3,
			instruction: 'prototypeEnd',
			arguments: [],
		} as const;
		const moduleLine = {
			lineNumber: 1,
			instruction: 'module',
			arguments: [{ type: 'identifier', value: 'main', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const shapeLine = {
			lineNumber: 2,
			instruction: 'shape',
			arguments: [{ type: 'identifier', value: 'state', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const pushMemoryLine = {
			lineNumber: 3,
			instruction: 'push',
			arguments: [{ type: 'identifier', value: 'value', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const valueAddressReference = {
			type: 'identifier',
			value: '&value',
			referenceKind: 'memory-reference',
			scope: 'local',
			targetMemoryId: 'value',
			isEndAddress: false,
		} as const;
		const pushAddressLine = {
			lineNumber: 4,
			instruction: 'push',
			arguments: [valueAddressReference],
		} as const;
		const callLine = {
			lineNumber: 5,
			instruction: 'call',
			arguments: [
				{ type: 'identifier', value: 'increment', referenceKind: 'plain', scope: 'local' },
				{ type: 'identifier', value: 'value', referenceKind: 'plain', scope: 'local' },
			],
		} as const;
		const pushShapeLine = {
			lineNumber: 6,
			instruction: 'pushShape',
			arguments: [{ type: 'identifier', value: 'state', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const moduleEndLine = {
			lineNumber: 7,
			instruction: 'moduleEnd',
			arguments: [],
		} as const;
		const functionLine = {
			lineNumber: 1,
			instruction: 'function',
			arguments: [{ type: 'identifier', value: 'increment', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const paramLine = {
			lineNumber: 2,
			instruction: 'param',
			arguments: [
				{ type: 'identifier', value: 'int', referenceKind: 'plain', scope: 'local' },
				{ type: 'identifier', value: 'amount', referenceKind: 'plain', scope: 'local' },
			],
		} as const;
		const localLine = {
			lineNumber: 3,
			instruction: 'local',
			arguments: [
				{ type: 'identifier', value: 'int', referenceKind: 'plain', scope: 'local' },
				{ type: 'identifier', value: 'temp', referenceKind: 'plain', scope: 'local' },
			],
		} as const;
		const pushParamLine = {
			lineNumber: 4,
			instruction: 'push',
			arguments: [{ type: 'identifier', value: 'amount', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const localSetLine = {
			lineNumber: 5,
			instruction: 'localSet',
			arguments: [{ type: 'identifier', value: 'temp', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const pushLocalLine = {
			lineNumber: 6,
			instruction: 'push',
			arguments: [{ type: 'identifier', value: 'temp', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const functionEndLine = {
			lineNumber: 7,
			instruction: 'functionEnd',
			arguments: [{ type: 'identifier', value: 'int', referenceKind: 'plain', scope: 'local' }],
		} as const;
		const valueMemory = {
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
			lineNumber: 2,
			isInteger: true,
			id: 'value',
			pointerDepth: 0,
			type: 'int',
			isUnsigned: false,
		} as const;
		const ast = {
			prototypes: [
				{
					type: 'prototype',
					id: 'state',
					prototypeLine,
					lines: [prototypeLine, valueDeclarationLine, prototypeEndLine],
				},
			],
			modules: [
				{
					type: 'module',
					id: 'main',
					moduleLine,
					lines: [moduleLine, shapeLine, pushMemoryLine, pushAddressLine, callLine, pushShapeLine, moduleEndLine],
				},
			],
			constants: [],
			functions: [
				{
					type: 'function',
					name: 'increment',
					functionLine,
					functionEndLine,
					lines: [functionLine, paramLine, localLine, pushParamLine, localSetLine, pushLocalLine, functionEndLine],
				},
			],
		} as const;
		const memoryPlan = {
			modules: {
				main: {
					id: 'main',
					lineNumber: 1,
					byteAddress: 4,
					wordAlignedSize: 1,
					wordAlignedByteLength: 4,
					endByteAddress: 4,
					endAddressSafeByteLength: 4,
					memoryIndex: 0,
					memory: {
						value: valueMemory,
					},
					declarations: [valueMemory],
					declarationSources: [
						{ line: { ...valueDeclarationLine, lineNumber: shapeLine.lineNumber }, isInherited: true },
					],
				},
			},
			moduleList: [
				{
					id: 'main',
					lineNumber: 1,
					byteAddress: 4,
					wordAlignedSize: 1,
					wordAlignedByteLength: 4,
					endByteAddress: 4,
					endAddressSafeByteLength: 4,
					memoryIndex: 0,
					memory: {
						value: valueMemory,
					},
					declarations: [valueMemory],
					declarationSources: [
						{ line: { ...valueDeclarationLine, lineNumber: shapeLine.lineNumber }, isInherited: true },
					],
				},
			],
			nextByteAddressByMemoryIndex: {
				0: 8,
			},
		} as const;
		const memoryReferences = {
			prototypes: [
				{
					lineFacts: [undefined, undefined, undefined],
				},
			],
			modules: [
				{
					lineFacts: [
						undefined,
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
										safeRange: {
											source: 'memory-start',
											memoryIndex: 0,
											byteAddress: 4,
											safeByteLength: 4,
											moduleId: 'main',
											memoryId: 'value',
										},
									},
								},
							],
						},
						undefined,
						undefined,
						undefined,
					],
				},
			],
			constants: [],
			functions: [
				{
					lineFacts: [undefined, undefined, undefined, undefined, undefined, undefined, undefined],
				},
			],
			declarationSourcesByModuleId: {
				main: {
					lineFacts: [undefined],
				},
			},
			pointerMetadataByModuleId: {
				main: {},
			},
		} as const;
		const constantReferences = {
			prototypes: [
				{
					lineFacts: [undefined, undefined, undefined],
				},
			],
			modules: [
				{
					lineFacts: [undefined, undefined, undefined, undefined, undefined, undefined, undefined],
				},
			],
			constants: [],
			functions: [
				{
					lineFacts: [undefined, undefined, undefined, undefined, undefined, undefined, undefined],
				},
			],
		} as const;
		const namespaces = {
			main: {
				kind: 'module',
				memoryIndex: 0,
				byteAddress: 4,
				wordAlignedSize: 1,
				memoryDefaults: {
					value: {
						value: 0,
						hasExplicitDefault: false,
						isInherited: true,
					},
				},
				pointerMetadata: {},
			},
		} as const;
		const functions = {
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
		} as const;
		const functionTypeRegistry = {
			types: [],
			signatures: [],
			baseTypeIndex: 3,
		} as const;
		const memoryDefaultsByModuleId = {
			main: {
				value: {
					value: 0,
					hasExplicitDefault: false,
					isInherited: true,
				},
			},
		} as const;
		const pointerMetadataByModuleId = {
			main: {},
		} as const;
		const memoryRegions = [] as const;
		const prototypeShapes = {
			state: ast.prototypes[0],
		} as const;

		expect(
			resolveSemanticReferences({
				ast,
				namespaces,
				memoryPlan,
				memoryDefaultsByModuleId,
				pointerMetadataByModuleId,
				constantReferences,
				memoryReferences,
				functions,
				functionTypeRegistry,
				memoryRegions,
				prototypeShapes,
			} satisfies SemanticReferenceResolverIntegrationInput)
		).toMatchSnapshot();
	});
});
