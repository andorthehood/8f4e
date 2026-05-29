import {
	call,
	i32const,
	localGet,
	localSet,
	WASM_END,
	WASM_I32_NE,
	WASM_IF,
	WASM_TYPE_VOID,
} from '@8f4e/compiler-wasm-utils';
import { ErrorCode } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { getError } from '../compilerError';

import type { InstructionCompiler, NormalizedAssertLine } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `assert`.
 * Calls the test failure import when the consumed integer does not equal the expected value.
 */
const assert: InstructionCompiler<NormalizedAssertLine> = (line, context) => {
	const expectedArg = line.arguments[0];

	if (context.assertFailureFunctionIndex === undefined || context.testAssertions === undefined) {
		throw getError(ErrorCode.MISSING_ASSERT_FAILURE_HANDLER, line, context);
	}

	const expected = expectedArg.value;
	const assertIndex = context.testAssertions.length;
	const moduleId = context.namespace.moduleName ?? context.codeBlockId ?? '';
	context.testAssertions.push({
		assertIndex,
		moduleId,
		lineNumber: line.lineNumberBeforeMacroExpansion + 1,
		expected,
	});

	const actualLocalIndex = Object.keys(context.locals).length;
	context.locals[`__assert_actual${assertIndex}`] = {
		isInteger: true,
		index: actualLocalIndex,
	};

	return saveByteCode(context, [
		...localSet(actualLocalIndex),
		...localGet(actualLocalIndex),
		...i32const(expected),
		WASM_I32_NE,
		WASM_IF,
		WASM_TYPE_VOID,
		...i32const(assertIndex),
		...i32const(expected),
		...localGet(actualLocalIndex),
		...call(context.assertFailureFunctionIndex),
		WASM_END,
	]);
};

export default assert;
