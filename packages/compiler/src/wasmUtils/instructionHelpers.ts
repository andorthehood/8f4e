import { ieee754, signedLEB128, unsignedLEB128 } from './typeHelpers';
import Instruction from './wasmInstruction';
import Type from './type';

export function localGet(index: number): number[] {
	return [Instruction.LOCAL_GET, ...unsignedLEB128(index)];
}

export function localSet(index: number): number[] {
	return [Instruction.LOCAL_SET, ...unsignedLEB128(index)];
}

export function call(functionIndex: number): number[] {
	return [Instruction.CALL, ...unsignedLEB128(functionIndex)];
}

export function i32const(number: number): number[] {
	return [Instruction.I32_CONST, ...signedLEB128(number)];
}

export function f32const(number: number): number[] {
	return [Instruction.F32_CONST, ...ieee754(number)];
}

export function i32store(address?: number, value?: number, alingment = 2, offset = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.I32_STORE,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
}

export function f32store(address?: number, value?: number, alingment = 2, offset = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.F32_STORE,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
}

export function i32load(alingment = 2, offset = 0): number[] {
	return [Instruction.I32_LOAD, ...unsignedLEB128(alingment), ...unsignedLEB128(offset)];
}

export function f32load(alingment = 2, offset = 0): number[] {
	return [Instruction.F32_LOAD, ...unsignedLEB128(alingment), ...unsignedLEB128(offset)];
}

export function ifelse(resultType: Type, trueBranch: number[], falseBranch: number[] = []): number[] {
	return [Instruction.IF, resultType, ...trueBranch, Instruction.ELSE, ...falseBranch, Instruction.END];
}

export function br(breakDepth: number): number[] {
	return [Instruction.BR, ...unsignedLEB128(breakDepth)];
}

export function br_if(breakDepth: number): number[] {
	return [Instruction.BR_IF, ...unsignedLEB128(breakDepth)];
}

export function loop(resultType: Type, code: number[]): number[] {
	return [Instruction.LOOP, resultType, ...code, ...br(0), Instruction.END];
}

export function block(resultType: Type, code: number[]): number[] {
	return [Instruction.BLOCK, resultType, ...code, Instruction.END];
}
