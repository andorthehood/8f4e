import type { CompilationContext, CompilerASTLine, MapBlockStackFrame, MemoryAddressRange } from '@8f4e/language-spec';
import { ArgumentType, BlockType, ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import { analyzeInstruction } from './analyzeInstruction';

function createStackAnalyzerTestContext(overrides: Partial<CompilationContext> = {}): CompilationContext {
	return {
		namespace: {
			moduleName: 'test',
			namespaces: {},
			prototypeShapeIds: [],
			...overrides.namespace,
		},
		locals: {},
		stack: [],
		blockStack: [
			{
				blockType: BlockType.MODULE,
				expectedResultTypes: [],
			},
		],
		activeBlockDepths: {
			[BlockType.MODULE]: 1,
			[BlockType.LOOP]: 0,
			[BlockType.CONDITION]: 0,
			[BlockType.FUNCTION]: 0,
			[BlockType.BLOCK]: 0,
			[BlockType.CONSTANTS]: 0,
			[BlockType.MAP]: 0,
		},
		activeLoopBlocks: [],
		insideModuleBlock: true,
		insideFunctionBlock: false,
		insideGenericBlock: false,
		insideLoopBlock: false,
		insideConditionBlock: false,
		insideConstantsBlock: false,
		insideMapBlock: false,
		startingByteAddress: 0,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: 0,
		memoryPlan: {
			modules: {},
			moduleList: [],
			nextByteAddressByMemoryIndex: {},
		},
		memoryDefaults: {},
		pointerMetadata: {},
		memoryRegions: [],
		byteCode: [],
		mode: 'module',
		codeBlockId: 'test',
		codeBlockType: 'module',
		...overrides,
	};
}

describe('analyzeInstruction', () => {
	it('records stack before, consumed operands, produced items, and stack after', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: true }
		);

		const line = {
			lineNumber: 1,
			instruction: 'add',
			arguments: [],
		} as CompilerASTLine;

		const facts = analyzeInstruction(line, context);

		expect(facts.stackAnalysis).toEqual({
			stackBefore: [
				{ kind: 'value', valueType: 'int', isNonZero: false },
				{ kind: 'value', valueType: 'int', isNonZero: true },
			],
			consumedOperands: [
				{ kind: 'value', valueType: 'int', isNonZero: false },
				{ kind: 'value', valueType: 'int', isNonZero: true },
			],
			producedStackItems: [{ kind: 'value', valueType: 'int', isNonZero: false }],
			stackAfter: [{ kind: 'value', valueType: 'int', isNonZero: false }],
		});
		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false }]);
		expect(facts.numericOperandKind).toBe('int32');
	});

	it('owns stack errors before codegen runs', () => {
		const context = createStackAnalyzerTestContext();
		const line = {
			lineNumber: 1,
			instruction: 'add',
			arguments: [],
		} as CompilerASTLine;

		expect(() => analyzeInstruction(line, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});

	it('records push-produced stack metadata', () => {
		const context = createStackAnalyzerTestContext();
		const line = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [{ type: ArgumentType.LITERAL, value: 7, isInteger: true }],
		} as CompilerASTLine;

		const facts = analyzeInstruction(line, context);

		expect(facts.stackAnalysis.producedStackItems).toEqual([
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 7 },
		]);
		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 7 }]);
	});

	it('records map input and output kinds', () => {
		const mapBlock: MapBlockStackFrame = {
			blockType: BlockType.MAP,
			expectedResultTypes: [],
			mapState: {
				inputIsInteger: false,
				inputIsFloat64: true,
				rows: [],
				defaultSet: false,
			},
		};
		const context = createStackAnalyzerTestContext({
			stack: [{ kind: 'value', valueType: 'float64' }],
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
				mapBlock,
			],
			activeMapBlock: mapBlock,
			insideMapBlock: true,
			activeBlockDepths: {
				[BlockType.MODULE]: 1,
				[BlockType.LOOP]: 0,
				[BlockType.CONDITION]: 0,
				[BlockType.FUNCTION]: 0,
				[BlockType.BLOCK]: 0,
				[BlockType.CONSTANTS]: 0,
				[BlockType.MAP]: 1,
			},
		});
		const line = {
			lineNumber: 1,
			instruction: 'mapEnd',
			arguments: [
				{
					type: ArgumentType.IDENTIFIER,
					value: 'float',
					referenceKind: 'plain',
					scope: 'local',
				},
			],
		} as CompilerASTLine;

		const facts = analyzeInstruction(line, context);

		expect(facts.map).toEqual({ inputKind: 'float64', outputKind: 'float32' });
	});

	it('records clamp address facts', () => {
		const range: MemoryAddressRange = {
			source: 'memory-start',
			memoryIndex: 2,
			memoryRegionName: 'aux',
			byteAddress: 16,
			safeByteLength: 64,
			memoryId: 'buffer',
		};
		const context = createStackAnalyzerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			address: { clampRange: range },
		});
		const line = {
			lineNumber: 1,
			instruction: 'clampAddress',
			arguments: [{ type: ArgumentType.LITERAL, value: GLOBAL_ALIGNMENT_BOUNDARY * 2, isInteger: true }],
		} as CompilerASTLine;

		const facts = analyzeInstruction(line, context);

		expect(facts.clamp).toEqual({
			accessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY * 2,
			memoryIndex: 2,
			range,
		});
	});
});
