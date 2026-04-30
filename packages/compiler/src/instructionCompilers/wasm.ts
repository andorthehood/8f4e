import { saveByteCode } from '../utils/compilation';

import type { CompilationContext, InstructionCompiler, WasmLine } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `wasm`.
 * @see [Instruction docs](../../docs/instructions/low-level.md)
 */
const wasm = function (line: WasmLine, context: CompilationContext) {
	return saveByteCode(context, [line.arguments[0].value]);
} as InstructionCompiler<WasmLine>;

export default wasm;
