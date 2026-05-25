import { call as wasmCall } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler, ResolvedCallLine } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `call`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const call: InstructionCompiler<ResolvedCallLine> = (line: ResolvedCallLine, context) => {
	// Emit WASM call instruction
	saveByteCode(context, wasmCall(line.targetFunction.wasmIndex));

	return context;
};

export default call;
