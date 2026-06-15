import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import local from './local';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('local instruction compiler', () => {
	it('adds a local variable', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			local,
			{
				lineNumber: 1,
				instruction: 'local',
				arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
			} as CompilerASTLine,
			context
		);

		expect(context.locals).toMatchSnapshot();
	});

	it('throws when local name collides with a memory identifier', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				namespaces: {},
				moduleName: 'test',
				memory: {
					count: {
						id: 'count',
						byteAddress: 0,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						numberOfElements: 1,
						elementWordSize: 4,
						type: 0,
						default: 0,
						isInteger: true,
						pointerDepth: 0,
						isUnsigned: false,
					},
				},
			},
		});

		let thrownError: unknown;
		try {
			analyzeAndCompileInstruction(
				local,
				{
					lineNumber: 1,
					instruction: 'local',
					arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
				} as CompilerASTLine,
				context
			);
		} catch (e) {
			thrownError = e;
		}

		expect(thrownError).toBeDefined();
		expect((thrownError as { code: number }).code).toBe(ErrorCode.LOCAL_NAME_COLLISION_WITH_MEMORY);
	});

	it('adds a pointer local variable with pointee metadata', () => {
		const context = createInstructionCompilerTestContext();

		analyzeAndCompileInstruction(
			local,
			{
				lineNumber: 1,
				instruction: 'local',
				arguments: [classifyIdentifier('float64**'), classifyIdentifier('cursor')],
			} as CompilerASTLine,
			context
		);

		expect(context.locals.cursor).toMatchObject({
			pointeeBaseType: 'float64',
			pointerDepth: 2,
			index: 0,
		});
	});
});
