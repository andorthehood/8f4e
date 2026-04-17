import { expect, test } from 'vitest';

import createFunction from './createFunction';

import Instruction from '../wasmInstruction';

test('createFunction wraps body with locals and end', () => {
	const func = createFunction([], [65, 42]);
	expect(func[func.length - 1]).toBe(Instruction.END);
});
