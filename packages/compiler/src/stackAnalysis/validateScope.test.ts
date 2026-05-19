import { describe, expect, it } from 'vitest';
import { type InstructionCompiler } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { validateScope } from './validateScope';

import createInstructionCompilerTestContext from '../utils/testUtils';

const line: Parameters<InstructionCompiler>[0] = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'test' as never,
	arguments: [],
};
describe('validateScope', () => {
	it('accepts valid scopes', () => {
		const cases = [
			['module', { insideModuleBlock: true }],
			['function', { insideFunctionBlock: true }],
			['moduleOrFunction', { insideModuleBlock: true }],
			['moduleOrFunction', { insideFunctionBlock: true }],
			['block', { insideGenericBlock: true }],
			['constants', { insideConstantsBlock: true }],
			['map', { insideMapBlock: true }],
		] as const;

		for (const [scope, contextFlags] of cases) {
			expect(() =>
				validateScope(
					scope,
					line,
					createInstructionCompilerTestContext({ blockStack: [], ...contextFlags }),
					ErrorCode.UNKNOWN_ERROR
				)
			).not.toThrow();
		}
	});

	it('rejects invalid scopes', () => {
		const context = createInstructionCompilerTestContext({ blockStack: [] });
		const cases: Array<Parameters<typeof validateScope>[0]> = [
			'module',
			'function',
			'moduleOrFunction',
			'block',
			'constants',
			'map',
		];

		for (const scope of cases) {
			expect(() => validateScope(scope, line, context, ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK)).toThrow(
				`${ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK}`
			);
		}
	});
});
