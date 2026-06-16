import type {
	ArrayDeclarationInstruction,
	MemoryRegionIdentity,
	MemoryType,
	PlannedMemoryDeclaration,
	PointeeBaseType,
	ScalarMemoryDeclarationInstruction,
} from '@8f4e/compiler-spec';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { alignAbsoluteWordOffset, getAbsoluteWordOffset, getByteAddressFromWordOffset } from './layoutAddresses';
import getMemoryFlags from './memoryFlags';

interface BaseDeclarationLayoutInput {
	id: string;
	lineNumber: number;
	startingByteAddress: number;
	localWordOffset: number;
	region: MemoryRegionIdentity;
}

export interface ScalarDeclarationLayoutInput extends BaseDeclarationLayoutInput {
	instruction: ScalarMemoryDeclarationInstruction;
}

export interface ArrayDeclarationLayoutInput extends BaseDeclarationLayoutInput {
	instruction: ArrayDeclarationInstruction;
	numberOfElements: number;
}

export interface PlannedMemoryDeclarationResult {
	declaration: PlannedMemoryDeclaration;
	nextLocalWordOffset: number;
}

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
export function planScalarDeclarationLayout(input: ScalarDeclarationLayoutInput): PlannedMemoryDeclarationResult {
	const pointerDepth = getPointerDepth(input.instruction);
	const baseType = getScalarBaseType(input.instruction);
	const flags = getMemoryFlags(baseType, pointerDepth);
	const nonPointerElementWordSize = baseType === 'float64' ? 8 : 4;

	if (pointerDepth > 0 || nonPointerElementWordSize === 4) {
		const wordAlignedSize = 1;
		return {
			declaration: {
				numberOfElements: 1,
				elementWordSize: 4,
				...input.region,
				wordAlignedAddress: getAbsoluteWordOffset(input.startingByteAddress, input.localWordOffset),
				wordAlignedSize,
				byteAddress: getByteAddressFromWordOffset(input.startingByteAddress, input.localWordOffset),
				id: input.id,
				lineNumber: input.lineNumber,
				type: input.instruction,
				...flags,
			},
			nextLocalWordOffset: input.localWordOffset + wordAlignedSize,
		};
	}

	const absoluteWordOffset = getAbsoluteWordOffset(input.startingByteAddress, input.localWordOffset);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, nonPointerElementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize = alignmentPadding + 2;

	return {
		declaration: {
			numberOfElements: 1,
			elementWordSize: nonPointerElementWordSize,
			...input.region,
			wordAlignedAddress: alignedAbsoluteWordOffset,
			wordAlignedSize,
			byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
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
export function planArrayDeclarationLayout(input: ArrayDeclarationLayoutInput): PlannedMemoryDeclarationResult {
	const elementWordSize = getArrayElementWordSize(input.instruction);
	const pointerDepth = getPointerDepth(input.instruction);
	const absoluteWordOffset = getAbsoluteWordOffset(input.startingByteAddress, input.localWordOffset);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, elementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize =
		alignmentPadding + Math.ceil((input.numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY);
	const pointeeBaseType = getArrayPointeeBaseType(input.instruction);

	return {
		declaration: {
			numberOfElements: input.numberOfElements,
			elementWordSize,
			...input.region,
			wordAlignedSize,
			wordAlignedAddress: alignedAbsoluteWordOffset,
			id: input.id,
			lineNumber: input.lineNumber,
			byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
			isInteger: input.instruction.startsWith('int') || input.instruction.includes('*'),
			pointerDepth,
			...(pointeeBaseType ? { pointeeBaseType } : {}),
			type: input.instruction.slice(0, -2) as MemoryType,
			isUnsigned: input.instruction.endsWith('u[]'),
		},
		nextLocalWordOffset: input.localWordOffset + wordAlignedSize,
	};
}
