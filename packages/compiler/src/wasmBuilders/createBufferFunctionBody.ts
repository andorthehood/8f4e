import call from '../wasmUtils/call/call';
import i32const from '../wasmUtils/const/i32const';
import localGet from '../wasmUtils/local/localGet';
import localSet from '../wasmUtils/local/localSet';
import br_if from '../wasmUtils/controlFlow/br_if';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';

/**
 * Creates the function body for the buffer function, which repeatedly calls the cycle function.
 *
 * @param bufferSize - Number of times to call the cycle function (default: 128)
 * @param bufferStrategy - Strategy to use: 'loop' (default, smaller code) or 'unrolled' (potentially faster)
 * @param cycleFunctionIndex - The WASM function index of the cycle function
 * @returns Byte array representing the buffer function body
 */
export default function createBufferFunctionBody(
	bufferSize: number = 128,
	bufferStrategy: 'loop' | 'unrolled' = 'loop',
	cycleFunctionIndex: number = 1
): number[] {
	if (bufferStrategy === 'unrolled') {
		return new Array(bufferSize).fill(call(cycleFunctionIndex)).flat();
	}

	// Loop strategy: use a counter and loop control flow
	// The loop pattern for counting down from N to 0:
	//   local.set $i (i32.const bufferSize)
	//   loop
	//     call $cycle
	//     local.tee $i (i32.sub (local.get $i) (i32.const 1))
	//     br_if 0  ; branch back to loop start if non-zero
	//   end

	const counterLocalIndex = 0;

	return [
		// Initialize counter: i32.const bufferSize, local.set $i
		...i32const(bufferSize),
		...localSet(counterLocalIndex),
		// loop $L0
		WASMInstruction.LOOP,
		Type.VOID,
		// call $cycle
		...call(cycleFunctionIndex),
		// Decrement counter and check: (local.get $i) - 1 -> local.set $i
		...localGet(counterLocalIndex),
		...i32const(1),
		WASMInstruction.I32_SUB,
		...localSet(counterLocalIndex),
		// Get counter value and branch if non-zero
		...localGet(counterLocalIndex),
		...br_if(0), // br_if 0 branches to start of loop (label 0)
		WASMInstruction.END,
	];
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('createBufferFunctionBody', () => {
		test('unrolled strategy generates repeated call instructions', () => {
			const result = createBufferFunctionBody(3, 'unrolled', 1);
			const callInstruction = [0x10, 1]; // call instruction with index 1
			expect(result).toEqual([...callInstruction, ...callInstruction, ...callInstruction]);
		});

		test('loop strategy generates loop control flow', () => {
			const result = createBufferFunctionBody(128, 'loop', 1);

			// Should contain i32.const 128
			expect(result).toContain(0x41); // I32_CONST
			expect(result).toContain(128);

			// Should contain loop
			expect(result).toContain(0x03); // LOOP

			// Should contain call
			expect(result).toContain(0x10); // CALL

			// Should contain br_if
			expect(result).toContain(0x0d); // BR_IF

			// Should contain local operations
			expect(result).toContain(0x20); // LOCAL_GET
			expect(result).toContain(0x21); // LOCAL_SET

			// Should contain I32_SUB
			expect(result).toContain(0x6b); // I32_SUB
		});

		test('loop strategy with custom buffer size', () => {
			const result = createBufferFunctionBody(256, 'loop', 1);

			// Should contain i32.const 256 (encoded as LEB128: 128, 2)
			expect(result).toContain(0x41); // I32_CONST
			const i32ConstIndex = result.indexOf(0x41);
			expect(result[i32ConstIndex + 1]).toBe(128);
			expect(result[i32ConstIndex + 2]).toBe(2);
		});

		test('default parameters use loop strategy with bufferSize 128', () => {
			const result = createBufferFunctionBody();

			// Should use loop strategy by default
			expect(result).toContain(0x03); // LOOP
			expect(result).toContain(0x0d); // BR_IF
		});
	});
}
