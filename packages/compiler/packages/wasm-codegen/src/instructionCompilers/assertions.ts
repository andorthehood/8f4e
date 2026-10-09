import { call, i32const, WASM_DROP } from '@8f4e/compiler-wasm-utils';
import type { InstructionCompiler } from '@8f4e/language-spec';
import { saveByteCode } from './utils/saveByteCode';

/** Emits a planned callback or consumes assertion operands when assertion emission is disabled. */
function assertionCompiler(operandCount: number): InstructionCompiler {
	return (line, context) => {
		if (!context.assertionCalls) {
			return saveByteCode(context, Array(operandCount).fill(WASM_DROP));
		}
		const site = context.assertionCalls.get(line.lineNumber)!;
		return saveByteCode(context, [...i32const(site.siteId), ...call(site.wasmIndex)]);
	};
}

export const assert = assertionCompiler(1);
export const assertEqual = assertionCompiler(2);
