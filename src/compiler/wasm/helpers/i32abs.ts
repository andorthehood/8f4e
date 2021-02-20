import { createFunctionBody } from '../sections';
import { i32const, localGet, ifelse } from '../instructions';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { FunctionBody } from '../types';

export const i32abs = function (): FunctionBody {
	return createFunctionBody(
		[],
		[
			...localGet(0),
			...i32const(0),
			Instruction.I32_LT_S,
			...ifelse(Type.I32, [...i32const(0), ...localGet(0), Instruction.I32_SUB], [...localGet(0)]),
		]
	);
};

export default i32abs;
