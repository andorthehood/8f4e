import { ArgumentType, type ValidatedModuleAST } from '@8f4e/language-spec';
import type { MemoryLayoutPlan, PlannedMemoryDeclaration, PlannedMemoryModule } from '@8f4e/memory-planner';
import { describe, expect, it } from 'vitest';
import { resolveMemoryReferences, tryResolveValueArgument } from './index';
import {
	type MemoryReferenceResolutionContext,
	resolveMemoryExpressionOperand,
} from './resolveMemoryExpressionOperand';

const { classifyIdentifier, parseArgument, parseCompileTimeOperand } = await import('@8f4e/tokenizer');

function getWordAlignedByteLength(wordAlignedSize: number): number {
	return Math.max(0, wordAlignedSize) * 4;
}

function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	return wordAlignedSize <= 0 ? byteAddress : byteAddress + (wordAlignedSize - 1) * 4;
}

function getEndAddressSafeByteLength(wordAlignedSize: number): number {
	return wordAlignedSize > 0 ? 4 : 0;
}

function createMemoryDeclaration(
	id: string,
	overrides: Partial<PlannedMemoryDeclaration> = {}
): PlannedMemoryDeclaration {
	const declaration = {
		id,
		lineNumber: 0,
		type: 'int',
		numberOfElements: 1,
		elementWordSize: 4,
		wordAlignedAddress: 0,
		wordAlignedSize: 1,
		byteAddress: 0,
		memoryIndex: 0,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};

	return {
		...declaration,
		elementByteLength: declaration.numberOfElements * declaration.elementWordSize,
		wordAlignedByteLength: getWordAlignedByteLength(declaration.wordAlignedSize),
		endByteAddress: getEndByteAddress(declaration.byteAddress, declaration.wordAlignedSize),
		endAddressSafeByteLength: getEndAddressSafeByteLength(declaration.wordAlignedSize),
	} as PlannedMemoryDeclaration;
}

function createPlannedModule(
	id: string,
	memory: Record<string, PlannedMemoryDeclaration>,
	overrides: Partial<PlannedMemoryModule> = {}
): PlannedMemoryModule {
	const module = {
		id,
		lineNumber: 0,
		byteAddress: 24,
		wordAlignedSize: 5,
		memoryIndex: 0,
		memory,
		declarations: Object.values(memory),
		declarationSources: [],
		...overrides,
	};

	return {
		...module,
		wordAlignedByteLength: getWordAlignedByteLength(module.wordAlignedSize),
		endByteAddress: getEndByteAddress(module.byteAddress, module.wordAlignedSize),
		endAddressSafeByteLength: getEndAddressSafeByteLength(module.wordAlignedSize),
	} as PlannedMemoryModule;
}

function createMemoryPlan(moduleList: readonly PlannedMemoryModule[]): MemoryLayoutPlan {
	return {
		modules: Object.fromEntries(moduleList.map(module => [module.id, module])),
		moduleList,
		nextByteAddressByMemoryIndex: { 0: 0 },
	};
}

function createTestContext(
	currentModule: PlannedMemoryModule,
	overrides: Partial<MemoryReferenceResolutionContext> = {}
): MemoryReferenceResolutionContext {
	return {
		memoryPlan: createMemoryPlan([currentModule]),
		currentModule,
		pointerMetadata: {},
		startingByteAddress: currentModule.byteAddress,
		currentModuleWordAlignedSize: currentModule.wordAlignedSize,
		currentMemoryIndex: currentModule.memoryIndex,
		...(currentModule.memoryRegionName ? { currentMemoryRegionName: currentModule.memoryRegionName } : {}),
		locals: {},
		...overrides,
	} as MemoryReferenceResolutionContext;
}

function withRemoteModules(
	context: MemoryReferenceResolutionContext,
	remoteModules: readonly PlannedMemoryModule[]
): MemoryReferenceResolutionContext {
	const currentModule = context.currentModule;
	return {
		...context,
		memoryPlan: createMemoryPlan([...(currentModule ? [currentModule] : []), ...remoteModules]),
	};
}

function noConstantReferences() {
	return {
		prototypes: [],
		modules: [],
		constants: [],
		functions: [],
	};
}

describe('resolveMemoryReferences', () => {
	it('resolves memory references across a project AST using the memory plan', () => {
		const moduleLine = {
			lineNumber: 1,
			instruction: 'module',
			arguments: [classifyIdentifier('main')],
		};
		const pushLine = {
			lineNumber: 2,
			instruction: 'push',
			arguments: [parseArgument('&buffer+4')],
		};
		const ast = {
			type: 'module',
			id: 'main',
			lines: [moduleLine, pushLine],
			moduleLine,
		} as unknown as ValidatedModuleAST;
		const buffer = createMemoryDeclaration('buffer', {
			lineNumber: 3,
			type: 'int',
			numberOfElements: 4,
			elementWordSize: 4,
			wordAlignedAddress: 4,
			wordAlignedSize: 4,
			byteAddress: 16,
		});
		const memoryPlan = createMemoryPlan([
			createPlannedModule('main', { buffer }, { byteAddress: 16, wordAlignedSize: 4 }),
		]);

		const result = resolveMemoryReferences({
			ast: {
				prototypes: [],
				modules: [ast],
				constants: [],
				functions: [],
			},
			memoryPlan,
			constantReferences: noConstantReferences(),
		});

		expect(result.references.modules[0].lineFacts[1]?.arguments?.[0]).toEqual({
			type: ArgumentType.LITERAL,
			value: 20,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 12,
					moduleId: 'main',
					memoryId: 'buffer',
				},
			},
		});
		expect(ast.lines[1]).toBe(pushLine);
	});

	it('uses pointer declaration address defaults for later pointee count queries', () => {
		const moduleLine = {
			lineNumber: 1,
			instruction: 'module',
			arguments: [classifyIdentifier('main')],
		};
		const samplesLine = {
			lineNumber: 2,
			instruction: 'float[]',
			arguments: [classifyIdentifier('samples'), { type: ArgumentType.LITERAL, value: 4, isInteger: true }],
		};
		const pointerLine = {
			lineNumber: 3,
			instruction: 'float*',
			arguments: [classifyIdentifier('ptr'), classifyIdentifier('&samples')],
		};
		const pushLine = {
			lineNumber: 4,
			instruction: 'push',
			arguments: [classifyIdentifier('count(*ptr)')],
		};
		const ast = {
			type: 'module',
			id: 'main',
			lines: [moduleLine, samplesLine, pointerLine, pushLine],
			moduleLine,
		} as unknown as ValidatedModuleAST;
		const samples = createMemoryDeclaration('samples', {
			lineNumber: 2,
			type: 'float',
			numberOfElements: 4,
			elementWordSize: 4,
			wordAlignedAddress: 4,
			wordAlignedSize: 4,
			byteAddress: 16,
			isInteger: false,
		});
		const ptr = createMemoryDeclaration('ptr', {
			lineNumber: 3,
			type: 'float*',
			wordAlignedAddress: 8,
			byteAddress: 32,
			pointeeBaseType: 'float',
			pointerDepth: 1,
		});
		const memoryPlan = createMemoryPlan([
			createPlannedModule('main', { samples, ptr }, { byteAddress: 16, wordAlignedSize: 5 }),
		]);

		const result = resolveMemoryReferences({
			ast: {
				prototypes: [],
				modules: [ast],
				constants: [],
				functions: [],
			},
			memoryPlan,
			constantReferences: noConstantReferences(),
		});

		expect(result.references.modules[0].lineFacts[3]?.arguments?.[0]).toEqual({
			type: ArgumentType.LITERAL,
			value: 4,
			isInteger: true,
		});
	});

	it('applies constant facts before resolving memory references', () => {
		const moduleLine = {
			lineNumber: 1,
			instruction: 'module',
			arguments: [classifyIdentifier('main')],
		};
		const pushLine = {
			lineNumber: 2,
			instruction: 'push',
			arguments: [parseArgument('&buffer+OFFSET')],
		};
		const ast = {
			type: 'module',
			id: 'main',
			lines: [moduleLine, pushLine],
			moduleLine,
		} as unknown as ValidatedModuleAST;
		const buffer = createMemoryDeclaration('buffer', {
			lineNumber: 3,
			type: 'int',
			numberOfElements: 4,
			elementWordSize: 4,
			wordAlignedAddress: 4,
			wordAlignedSize: 4,
			byteAddress: 16,
		});
		const memoryPlan = createMemoryPlan([
			createPlannedModule('main', { buffer }, { byteAddress: 16, wordAlignedSize: 4 }),
		]);

		const result = resolveMemoryReferences({
			ast: {
				prototypes: [],
				modules: [ast],
				constants: [],
				functions: [],
			},
			memoryPlan,
			constantReferences: {
				prototypes: [],
				modules: [
					{
						lineFacts: [
							undefined,
							{
								arguments: [parseArgument('&buffer+4')],
							},
						],
					},
				],
				constants: [],
				functions: [],
			},
		});

		expect(pushLine.arguments[0]).toEqual(parseArgument('&buffer+OFFSET'));
		expect(result.references.modules[0].lineFacts[1]?.arguments?.[0]).toMatchObject({
			type: ArgumentType.LITERAL,
			value: 20,
		});
	});
});

describe('tryResolveValueArgument', () => {
	const samples = createMemoryDeclaration('samples', {
		byteAddress: 32,
		numberOfElements: 8,
		elementWordSize: 2,
		wordAlignedSize: 4,
	});
	const floatBuf = createMemoryDeclaration('floatBuf', {
		numberOfElements: 4,
		elementWordSize: 4,
		isInteger: false,
		type: 'float',
	});
	const floatPtr = createMemoryDeclaration('floatPtr', {
		numberOfElements: 1,
		elementWordSize: 4,
		isInteger: true,
		pointeeBaseType: 'float',
		pointerDepth: 1,
		type: 'float*',
	});
	const mainModule = createPlannedModule('main', {
		samples,
		floatBuf,
		floatPtr,
	});
	const mockContext = createTestContext(mainModule, {
		pointerMetadata: {
			main: {
				floatPtr: {
					pointeeElementCount: 4,
				},
			},
		},
	});

	it('resolves memory expression operands without resolving constant identifiers', () => {
		expect(resolveMemoryExpressionOperand(parseCompileTimeOperand('sizeof(samples)'), mockContext)).toEqual({
			value: 2,
			isInteger: true,
		});
		expect(resolveMemoryExpressionOperand(parseCompileTimeOperand('SIZE'), mockContext)).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('SIZE'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('SIZE*2'))).toBeUndefined();
	});

	it('resolves sizeof(name) * literal', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(samples)*2'))).toEqual({
			value: 4,
			isInteger: true,
		});
	});

	it('resolves literal * sizeof(name)', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('123*sizeof(samples)'))).toEqual({
			value: 246,
			isInteger: true,
		});
	});

	it('resolves count(name) * literal', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('count(samples)*2'))).toEqual({
			value: 16,
			isInteger: true,
		});
	});

	it('resolves local memory metadata queries', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('count(*floatPtr)'))).toEqual({
			value: 4,
			isInteger: true,
		});
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(*floatPtr)'))).toEqual({
			value: 4,
			isInteger: true,
		});
		expect(tryResolveValueArgument(mockContext, parseArgument('max(*floatPtr)'))).toEqual({
			value: 3.4028234663852886e38,
			isInteger: false,
		});
		expect(tryResolveValueArgument(mockContext, parseArgument('min(*floatPtr)'))).toEqual({
			value: -3.4028234663852886e38,
			isInteger: false,
		});
		expect(tryResolveValueArgument(mockContext, parseArgument('max(samples)'))).toEqual({
			value: 32767,
			isInteger: true,
		});
		expect(tryResolveValueArgument(mockContext, parseArgument('min(samples)'))).toEqual({
			value: -32768,
			isInteger: true,
		});
	});

	it('returns undefined for unresolved local memory metadata queries', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(missing)'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('count(missing)'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('max(missing)'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('min(missing)'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(*missing)'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('max(*missing)'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('min(*missing)'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('count(*missing)'))).toBeUndefined();
	});

	it('returns undefined for unresolved or chained expressions', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('MISSING'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, classifyIdentifier('SIZE/2/2'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, classifyIdentifier('SIZE*2/2'))).toBeUndefined();
	});

	it('resolves intermodule sizeof expressions', () => {
		const buffer = createMemoryDeclaration('buffer', {
			numberOfElements: 4,
			elementWordSize: 2,
		});
		const intermodularNamespace = withRemoteModules(mockContext, [createPlannedModule('source', { buffer })]);

		expect(tryResolveValueArgument(intermodularNamespace, parseArgument('2*sizeof(source:buffer)'))).toEqual({
			value: 4,
			isInteger: true,
		});
	});

	it('treats max(*localDoublePointer) as an integer-valued pointer slot even for float pointees', () => {
		const localPointerContext = {
			...mockContext,
			locals: {
				floatPtrPtr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'float64',
					pointerDepth: 2,
					index: 0,
				},
			},
		} as unknown as MemoryReferenceResolutionContext;

		expect(tryResolveValueArgument(localPointerContext, parseArgument('max(*floatPtrPtr)'))).toEqual({
			value: 2147483647,
			isInteger: true,
		});
		expect(tryResolveValueArgument(localPointerContext, parseArgument('min(*floatPtrPtr)'))).toEqual({
			value: -2147483648,
			isInteger: true,
		});
	});

	it('resolves pointee metadata from local pointer bindings', () => {
		const localPointerContext = {
			...mockContext,
			locals: {
				localFloatPtr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'float',
					pointerDepth: 1,
					pointeeElementCount: 7,
					index: 0,
				},
			},
		} as unknown as MemoryReferenceResolutionContext;

		expect(tryResolveValueArgument(localPointerContext, parseArgument('count(*localFloatPtr)'))).toEqual({
			value: 7,
			isInteger: true,
		});
		expect(tryResolveValueArgument(localPointerContext, parseArgument('sizeof(*localFloatPtr)'))).toEqual({
			value: 4,
			isInteger: true,
		});
		expect(tryResolveValueArgument(localPointerContext, parseArgument('max(*localFloatPtr)'))).toEqual({
			value: 3.4028234663852886e38,
			isInteger: false,
		});
		expect(tryResolveValueArgument(localPointerContext, parseArgument('min(*localFloatPtr)'))).toEqual({
			value: -3.4028234663852886e38,
			isInteger: false,
		});
	});

	it('does not resolve count(*localPointer) without element count metadata', () => {
		const localPointerContext = {
			...mockContext,
			locals: {
				localFloatPtr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'float',
					pointerDepth: 1,
					index: 0,
				},
			},
		} as unknown as MemoryReferenceResolutionContext;

		expect(tryResolveValueArgument(localPointerContext, parseArgument('count(*localFloatPtr)'))).toBeUndefined();
		expect(tryResolveValueArgument(localPointerContext, parseArgument('sizeof(*localFloatPtr)'))).toEqual({
			value: 4,
			isInteger: true,
		});
	});

	it('resolves non-word-sized pointee widths from local pointer bindings', () => {
		const localPointerContext = {
			...mockContext,
			locals: {
				int8Ptr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'int8',
					pointerDepth: 1,
					index: 0,
				},
				int16Ptr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'int16',
					pointerDepth: 1,
					index: 1,
				},
				float64Ptr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'float64',
					pointerDepth: 1,
					index: 2,
				},
			},
		} as unknown as MemoryReferenceResolutionContext;

		expect(tryResolveValueArgument(localPointerContext, parseArgument('sizeof(*int8Ptr)'))).toEqual({
			value: 1,
			isInteger: true,
		});
		expect(tryResolveValueArgument(localPointerContext, parseArgument('sizeof(*int16Ptr)'))).toEqual({
			value: 2,
			isInteger: true,
		});
		expect(tryResolveValueArgument(localPointerContext, parseArgument('sizeof(*float64Ptr)'))).toEqual({
			value: 8,
			isInteger: true,
		});
	});

	it('resolves explicit value expression nodes', () => {
		expect(
			tryResolveValueArgument(mockContext, {
				type: ArgumentType.COMPILE_TIME_EXPRESSION,
				left: parseCompileTimeOperand('2'),
				operator: '*',
				right: parseCompileTimeOperand('sizeof(samples)'),
			})
		).toEqual({
			value: 4,
			isInteger: true,
		});
	});

	it('resolves exponentiation with sizeof: sizeof(name)^literal', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(samples)^2'))).toEqual({
			value: 4,
			isInteger: true,
		});
	});

	it('resolves addition with sizeof: sizeof(name)+1', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(samples)+1'))).toEqual({
			value: 3,
			isInteger: true,
		});
	});

	it('resolves subtraction with sizeof: sizeof(name)-1', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(samples)-1'))).toEqual({
			value: 1,
			isInteger: true,
		});
	});

	it('resolves intermodule start-address reference (&module:memory) once module is laid out', () => {
		const buffer = createMemoryDeclaration('buffer', {
			byteAddress: 8,
			wordAlignedSize: 4,
			numberOfElements: 4,
			elementWordSize: 4,
		});
		const laidOutNamespace = withRemoteModules(mockContext, [
			createPlannedModule('source', { buffer }, { byteAddress: 8, wordAlignedSize: 4 }),
		]);

		expect(tryResolveValueArgument(laidOutNamespace, classifyIdentifier('&source:buffer'))).toEqual({
			value: 8,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 8,
					safeByteLength: 16,
					moduleId: 'source',
					memoryId: 'buffer',
				},
			},
		});
	});

	it('resolves intermodule end-address reference (module:memory&) once module is laid out', () => {
		const buffer = createMemoryDeclaration('buffer', {
			byteAddress: 8,
			wordAlignedSize: 4,
			numberOfElements: 4,
			elementWordSize: 4,
		});
		const laidOutNamespace = withRemoteModules(mockContext, [
			createPlannedModule('source', { buffer }, { byteAddress: 8, wordAlignedSize: 4 }),
		]);

		// End address = byteAddress + (wordAlignedSize - 1) * 4 = 8 + 3 * 4 = 20
		expect(tryResolveValueArgument(laidOutNamespace, classifyIdentifier('source:buffer&'))).toEqual({
			value: 20,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-end',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 4,
					moduleId: 'source',
					memoryId: 'buffer',
				},
			},
		});
	});

	it('resolves intermodule module-base start-address (&module:) once module is laid out', () => {
		const laidOutNamespace = withRemoteModules(mockContext, [
			createPlannedModule('source', {}, { byteAddress: 12, wordAlignedSize: 3 }),
		]);

		expect(tryResolveValueArgument(laidOutNamespace, classifyIdentifier('&source:'))).toEqual({
			value: 12,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-start',
					memoryIndex: 0,
					byteAddress: 12,
					safeByteLength: 12,
					moduleId: 'source',
				},
			},
		});
	});

	it('resolves intermodule module-base end-address (module:&) once module is laid out', () => {
		const laidOutNamespace = withRemoteModules(mockContext, [
			createPlannedModule('source', {}, { byteAddress: 12, wordAlignedSize: 3 }),
		]);

		// End address = 12 + (3 - 1) * 4 = 12 + 8 = 20
		expect(tryResolveValueArgument(laidOutNamespace, classifyIdentifier('source:&'))).toEqual({
			value: 20,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-end',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 4,
					moduleId: 'source',
				},
			},
		});
	});

	it('returns undefined for missing intermodule address references', () => {
		expect(tryResolveValueArgument(mockContext, classifyIdentifier('&source:buffer'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, classifyIdentifier('&source:'))).toBeUndefined();
	});

	it('returns undefined for unresolved intermodule nth references', () => {
		const laidOutNamespace = withRemoteModules(mockContext, [
			createPlannedModule('source', {}, { byteAddress: 8, wordAlignedSize: 4 }),
		]);

		expect(tryResolveValueArgument(laidOutNamespace, classifyIdentifier('&source:99'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, classifyIdentifier('&source:99'))).toBeUndefined();
	});

	it('resolves current-module shorthands from compilation context', () => {
		expect(tryResolveValueArgument(mockContext, classifyIdentifier('&this'))).toEqual({
			value: 24,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-start',
					memoryIndex: 0,
					byteAddress: 24,
					safeByteLength: 20,
					moduleId: 'main',
				},
			},
		});
		expect(tryResolveValueArgument(mockContext, classifyIdentifier('this&'))).toEqual({
			value: 40,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-end',
					memoryIndex: 0,
					byteAddress: 40,
					safeByteLength: 4,
					moduleId: 'main',
				},
			},
		});
	});

	it('returns undefined for current-module shorthands without a current planned module', () => {
		const contextWithoutCurrentModule = {
			...mockContext,
			currentModule: undefined,
		} as unknown as MemoryReferenceResolutionContext;

		expect(tryResolveValueArgument(contextWithoutCurrentModule, classifyIdentifier('&this'))).toBeUndefined();
		expect(tryResolveValueArgument(contextWithoutCurrentModule, classifyIdentifier('this&'))).toBeUndefined();
	});

	it('keeps address metadata when adding an in-range integer offset to an address expression', () => {
		const arr = createMemoryDeclaration('arr', {
			byteAddress: 16,
			wordAlignedSize: 4,
			numberOfElements: 4,
			elementWordSize: 4,
		});
		const addressContext = createTestContext(createPlannedModule('main', { arr }));

		expect(tryResolveValueArgument(addressContext, parseArgument('&arr+4'))).toEqual({
			value: 20,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 12,
					memoryId: 'arr',
				},
			},
		});
	});

	it('keeps address metadata when adding an address expression to an integer offset', () => {
		const arr = createMemoryDeclaration('arr', {
			byteAddress: 16,
			wordAlignedSize: 4,
			numberOfElements: 4,
			elementWordSize: 4,
		});
		const addressContext = createTestContext(createPlannedModule('main', { arr }));

		expect(tryResolveValueArgument(addressContext, parseArgument('4+&arr'))).toEqual({
			value: 20,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 12,
					memoryId: 'arr',
				},
			},
		});
	});

	it('drops address metadata when address expression arithmetic leaves the known safe range', () => {
		const arr = createMemoryDeclaration('arr', {
			byteAddress: 16,
			wordAlignedSize: 4,
			numberOfElements: 4,
			elementWordSize: 4,
		});
		const addressContext = createTestContext(createPlannedModule('main', { arr }));

		expect(tryResolveValueArgument(addressContext, parseArgument('&arr+1024'))).toEqual({
			value: 1040,
			isInteger: true,
		});
		expect(tryResolveValueArgument(addressContext, parseArgument('&arr-4'))).toEqual({
			value: 12,
			isInteger: true,
		});
	});

	it('returns undefined for division by zero and non-identifier arguments', () => {
		expect(tryResolveValueArgument(mockContext, parseArgument('sizeof(samples)/0'))).toBeUndefined();
		expect(tryResolveValueArgument(mockContext, parseArgument('123'))).toBeUndefined();
	});
});
