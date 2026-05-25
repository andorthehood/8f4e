import { call as wasmCall } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { CallLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `call`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const call: InstructionCompiler<CallLine> = (line: CallLine, context) => {
	// Normalization (normalizeCall) guarantees the function exists before codegen runs.
	const targetFunction = context.namespace.functions![line.arguments[0].value]!;

	// Emit WASM call instruction
	saveByteCode(context, wasmCall(targetFunction.wasmIndex));

	return context;
};

export default call;
