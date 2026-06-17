import type {
	ArrayDeclarationInstruction,
	MemoryRegionIdentity,
	MemoryType,
	PointeeBaseType,
	ScalarMemoryDeclarationInstruction,
} from '@8f4e/language-spec';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/language-spec';
import {
	alignAbsoluteWordOffset,
	getAbsoluteWordOffset,
	getByteAddressFromWordOffset,
	getEndAddressSafeByteLength,
	getEndByteAddress,
	getWordAlignedByteLength,
} from './layoutAddresses';
import getMemoryFlags from './memoryFlags';

function getPointerDepth(instruction: string): number {
	return instruction.endsWith('**') || instruction.includes('**[]') ? 2 : instruction.includes('*') ? 1 : 0;
}

function getScalarBaseType(instruction: ScalarMemoryDeclarationInstruction): PointeeBaseType {
	return instruction.replace(/\*+$/, '') as PointeeBaseType;
}

function getArrayElementWordSize(instruction: ArrayDeclarationInstruction): number {
	if (instruction.startsWith('float64') && !instruction.includes('*')) return 8;
	if (instruction.includes('8')) return 1;
	if (instruction.includes('16')) return 2;
	return 4;
}

function getArrayPointeeBaseType(instruction: ArrayDeclarationInstruction): PointeeBaseType | undefined {
	if (!instruction.includes('*')) {
		return undefined;
	}
	if (instruction.startsWith('float64')) {
		return 'float64';
	}
	if (instruction.startsWith('int')) {
		return 'int';
	}
	return 'float';
}

/**
 * Plans address and size metadata for a scalar or pointer declaration.
 *
 * @param input - Declaration layout facts already resolved by the compiler.
 * @returns The planned declaration and updated local word offset.
 */
export function planScalarDeclarationLayout(input: {
	id: string;
	lineNumber: number;
	startingByteAddress: number;
	localWordOffset: number;
	region: MemoryRegionIdentity;
	instruction: ScalarMemoryDeclarationInstruction;
}) {
	const pointerDepth = getPointerDepth(input.instruction);
	const baseType = getScalarBaseType(input.instruction);
	const flags = getMemoryFlags(baseType, pointerDepth);
	const nonPointerElementWordSize = baseType === 'float64' ? 8 : 4;

	if (pointerDepth > 0 || nonPointerElementWordSize === 4) {
		const numberOfElements = 1;
		const elementWordSize = 4;
		const wordAlignedSize = 1;
		const byteAddress = getByteAddressFromWordOffset(input.startingByteAddress, input.localWordOffset);
		return {
			declaration: {
				numberOfElements,
				elementWordSize,
				...input.region,
				wordAlignedAddress: getAbsoluteWordOffset(input.startingByteAddress, input.localWordOffset),
				wordAlignedSize,
				wordAlignedByteLength: getWordAlignedByteLength(wordAlignedSize),
				byteAddress,
				elementByteLength: numberOfElements * elementWordSize,
				endByteAddress: getEndByteAddress(byteAddress, wordAlignedSize),
				endAddressSafeByteLength: getEndAddressSafeByteLength(wordAlignedSize),
				id: input.id,
				lineNumber: input.lineNumber,
				type: input.instruction,
				...flags,
			},
			nextLocalWordOffset: input.localWordOffset + wordAlignedSize,
		};
	}

	const numberOfElements = 1;
	const absoluteWordOffset = getAbsoluteWordOffset(input.startingByteAddress, input.localWordOffset);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, nonPointerElementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize = alignmentPadding + 2;
	const byteAddress = getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset);

	return {
		declaration: {
			numberOfElements,
			elementWordSize: nonPointerElementWordSize,
			...input.region,
			wordAlignedAddress: alignedAbsoluteWordOffset,
			wordAlignedSize,
			wordAlignedByteLength: getWordAlignedByteLength(wordAlignedSize),
			byteAddress,
			elementByteLength: numberOfElements * nonPointerElementWordSize,
			endByteAddress: getEndByteAddress(byteAddress, wordAlignedSize),
			endAddressSafeByteLength: getEndAddressSafeByteLength(wordAlignedSize),
			id: input.id,
			lineNumber: input.lineNumber,
			type: input.instruction,
			...flags,
		},
		nextLocalWordOffset: input.localWordOffset + wordAlignedSize,
	};
}

/**
 * Plans address and size metadata for an array declaration.
 *
 * @param input - Declaration layout facts already resolved by the compiler.
 * @returns The planned declaration and updated local word offset.
 */
export function planArrayDeclarationLayout(input: {
	id: string;
	lineNumber: number;
	startingByteAddress: number;
	localWordOffset: number;
	region: MemoryRegionIdentity;
	instruction: ArrayDeclarationInstruction;
	numberOfElements: number;
}) {
	const elementWordSize = getArrayElementWordSize(input.instruction);
	const pointerDepth = getPointerDepth(input.instruction);
	const absoluteWordOffset = getAbsoluteWordOffset(input.startingByteAddress, input.localWordOffset);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, elementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize =
		alignmentPadding + Math.ceil((input.numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY);
	const pointeeBaseType = getArrayPointeeBaseType(input.instruction);
	const byteAddress = getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset);

	return {
		declaration: {
			numberOfElements: input.numberOfElements,
			elementWordSize,
			...input.region,
			wordAlignedSize,
			wordAlignedByteLength: getWordAlignedByteLength(wordAlignedSize),
			wordAlignedAddress: alignedAbsoluteWordOffset,
			id: input.id,
			lineNumber: input.lineNumber,
			byteAddress,
			elementByteLength: input.numberOfElements * elementWordSize,
			endByteAddress: getEndByteAddress(byteAddress, wordAlignedSize),
			endAddressSafeByteLength: getEndAddressSafeByteLength(wordAlignedSize),
			isInteger: input.instruction.startsWith('int') || input.instruction.includes('*'),
			pointerDepth,
			...(pointeeBaseType ? { pointeeBaseType } : {}),
			type: input.instruction.slice(0, -2) as MemoryType,
			isUnsigned: input.instruction.endsWith('u[]'),
		},
		nextLocalWordOffset: input.localWordOffset + wordAlignedSize,
	};
}
