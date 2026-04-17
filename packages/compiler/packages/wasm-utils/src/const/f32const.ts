import ieee754 from '../encoding/ieee754';
import Instruction from '../wasmInstruction';

/**
 * Creates a WebAssembly f32.const instruction to push a 32-bit floating-point constant onto the stack.
 *
 * @param number - The floating-point value
 * @returns Byte array representing the f32.const instruction
 */
export default function f32const(number: number): number[] {
	return [Instruction.F32_CONST, ...ieee754(number)];
}
