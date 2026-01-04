import call from '../wasmUtils/call/call';
import i32const from '../wasmUtils/const/i32const';
import localGet from '../wasmUtils/local/localGet';
import localSet from '../wasmUtils/local/localSet';
import br_if from '../wasmUtils/controlFlow/br_if';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createFunction from '../wasmUtils/codeSection/createFunction';
import createLocalDeclaration from '../wasmUtils/codeSection/createLocalDeclaration';

import type { FunctionBody } from '../wasmUtils/section';

/**
 * Creates the complete buffer function, which repeatedly calls the cycle function.
 *
 * @param bufferSize - Number of times to call the cycle function (default: 128)
 * @param bufferStrategy - Strategy to use: 'loop' (default, smaller code) or 'unrolled' (potentially faster)
 * @param cycleFunctionIndex - The WASM function index of the cycle function
 * @returns Complete function body with locals and END instruction
 */
export default function createBufferFunctionBody(
	bufferSize: number = 128,
	bufferStrategy: 'loop' | 'unrolled' = 'loop',
	cycleFunctionIndex: number = 1
): FunctionBody {
	if (bufferStrategy === 'unrolled') {
		const body = new Array(bufferSize).fill(call(cycleFunctionIndex)).flat();
		return createFunction([], body);
	}

	// Loop strategy: use a counter and loop control flow
	// The loop pattern for counting down from N to 0:
	//   local.set $i (i32.const bufferSize)
	//   loop
	//     call $cycle
	//     local.set $i (i32.sub (local.get $i) (i32.const 1))
	//     br_if 0 (local.get $i)  ; branch back to loop start if non-zero
	//   end

	const counterLocalIndex = 0;

	const body = [
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

	// Loop strategy needs a local i32 counter variable
	return createFunction([createLocalDeclaration(Type.I32, 1)], body);
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('createBufferFunctionBody', () => {
		test('unrolled strategy generates repeated call instructions', () => {
			const result = createBufferFunctionBody(3, 'unrolled', 1);
			expect(result).toMatchSnapshot();
		});

		test('loop strategy generates loop control flow', () => {
			const result = createBufferFunctionBody(128, 'loop', 1);
			expect(result).toMatchSnapshot();
		});

		test('loop strategy with custom buffer size', () => {
			const result = createBufferFunctionBody(256, 'loop', 1);
			expect(result).toMatchSnapshot();
		});

		test('default parameters use loop strategy with bufferSize 128', () => {
			const result = createBufferFunctionBody();
			expect(result).toMatchSnapshot();
		});
	});
}
