import { describe, expect, it } from 'vitest';

import local from './local';

import { ErrorCode } from '../compilerError';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('local instruction compiler', () => {
	it('adds a local variable', () => {
		const context = createInstructionCompilerTestContext();

		local(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'local',
				arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
			} as AST[number],
			context
		);

		expect(context.locals).toMatchSnapshot();
	});

	it('throws when local name collides with a memory identifier', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				namespaces: {},
				consts: {},
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
						isPointingToPointer: false,
						isUnsigned: false,
					},
				},
			},
		});

		let thrownError: unknown;
		try {
			local(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'local',
					arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
				} as AST[number],
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

		local(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'local',
				arguments: [classifyIdentifier('float64**'), classifyIdentifier('cursor')],
			} as AST[number],
			context
		);

		expect(context.locals.cursor).toMatchObject({
			isInteger: true,
			pointeeBaseType: 'float64',
			isPointingToPointer: true,
			index: 0,
		});
	});
});
