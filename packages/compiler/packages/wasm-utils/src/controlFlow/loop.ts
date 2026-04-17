import br from './br';

import Instruction from '../wasmInstruction';
import Type from '../type';

/**
 * Creates a WebAssembly loop structure with automatic back-edge branching.
 *
 * @param resultType - The result type of the loop
 * @param code - Instructions to execute in the loop body
 * @returns Byte array representing the loop-end structure with a branch back to start
 */
export default function loop(resultType: Type, code: number[]): number[] {
	return [Instruction.LOOP, resultType, ...code, ...br(0), Instruction.END];
}
