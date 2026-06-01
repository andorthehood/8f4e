import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import _if from './if';

describe('if instruction compiler', () => {
	it('emits a void if block when the matching ifEnd declares no result', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			_if,
			{
				lineNumber: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultTypes: [], hasElse: false },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a void if block when given no arguments', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			_if,
			{
				lineNumber: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultTypes: [], hasElse: false },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a float if block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			_if,
			{
				lineNumber: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultTypes: ['float'], hasElse: false },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits an int if block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			_if,
			{
				lineNumber: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultTypes: ['int'], hasElse: false },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a multi-result if block type index', () => {
		const context = createInstructionCompilerTestContext({
			functionTypeRegistry: {
				baseTypeIndex: 0,
				signatures: [],
				types: [],
			},
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			_if,
			{
				lineNumber: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultTypes: ['int', 'float'], hasElse: false },
			} as CompilerASTLine,
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
			typeSignatures: context.functionTypeRegistry?.signatures,
			typeCount: context.functionTypeRegistry?.types.length,
		}).toMatchSnapshot();
	});
});
