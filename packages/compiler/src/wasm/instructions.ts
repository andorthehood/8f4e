import { unsignedLEB128, signedLEB128, ieee754 } from './types';
import { Instruction, Type } from 'wasm-bytecode-utils';

export const localGet = function (index: number): number[] {
	return [Instruction.LOCAL_GET, ...unsignedLEB128(index)];
};

export const localSet = function (index: number): number[] {
	return [Instruction.LOCAL_SET, ...unsignedLEB128(index)];
};

export const call = function (functionIndex: number): number[] {
	return [Instruction.CALL, ...unsignedLEB128(functionIndex)];
};

export const i32const = function (number: number): number[] {
	return [Instruction.I32_CONST, ...signedLEB128(number)];
};

export const f32const = function (number: number): number[] {
	return [Instruction.F32_CONST, ...ieee754(number)];
};

export const i32store = function (
	address?: number,
	value?: number,
	alingment: number = 2,
	offset: number = 0
): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.I32_STORE,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
};

export const f32store = function (
	address?: number,
	value?: number,
	alingment: number = 2,
	offset: number = 0
): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.F32_STORE,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
};

export const i32load = function (address?: number, alingment: number = 2, offset: number = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		Instruction.I32_LOAD,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
};

export const f32load = function (address?: number, alingment: number = 2, offset: number = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		Instruction.F32_LOAD,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
};

export const ifelse = function (resultType: Type, trueBranch: number[], falseBranch: number[] = []): number[] {
	return [Instruction.IF, resultType, ...trueBranch, Instruction.ELSE, ...falseBranch, Instruction.END];
};

export const br = function (breakDepth: number): number[] {
	return [Instruction.BR, ...unsignedLEB128(breakDepth)];
};

export const br_if = function (breakDepth: number): number[] {
	return [Instruction.BR_IF, ...unsignedLEB128(breakDepth)];
};

export const loop = function (resultType: Type, code: number[]): number[] {
	return [Instruction.LOOP, resultType, ...code, ...br(0), Instruction.END];
};

export const block = function (resultType: Type, code: number[]): number[] {
	return [Instruction.BLOCK, resultType, ...code, Instruction.END];
};
