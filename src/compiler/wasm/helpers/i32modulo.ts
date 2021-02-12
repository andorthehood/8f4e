import { createFunctionBody } from '../sections';
import { i32const, localGet } from '../instructions';
import { Instruction } from '../enums';
import { FunctionBody } from '../types';

export const i32modulo = function (): FunctionBody {
	return createFunctionBody(
		[],
		[
			...i32const(0),
			...localGet(0),
			...localGet(1),
			Instruction.I32_DIV_U,
			...localGet(1),
			Instruction.I32_MUL,
			...localGet(0),
			Instruction.I32_SUB,
			Instruction.I32_SUB,
		]
	);
};

export default i32modulo;
