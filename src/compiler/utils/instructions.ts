import { unsignedLEB128, signedLEB128, ieee754 } from './utils';
import { Instruction, Type } from '../enums';

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

export const localGet = function (index: number): number[] {
	return [Instruction.LOCAL_GET, ...unsignedLEB128(index)];
};

export const ifelse = function (resultType: Type, trueBranch: number[], falseBranch: number[]): number[] {
	return [Instruction.IF, resultType, ...trueBranch, Instruction.ELSE, ...falseBranch, Instruction.END];
};

export const i32loadAddress = function (address: number, alingment: number = 2, offset: number = 0): number[] {
	return [...i32load(address), ...i32load()];
};
