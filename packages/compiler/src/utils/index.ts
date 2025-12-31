// Memory identifier utilities
export {
	isMemoryIdentifier,
	isMemoryReferenceIdentifier,
	isMemoryPointerIdentifier,
	isElementCountIdentifier,
	isElementWordSizeIdentifier,
} from './memoryIdentifier';

// Memory data utilities
export {
	getDataStructure,
	getDataStructureByteAddress,
	getMemoryStringLastByteAddress,
	getElementCount,
	getElementWordSize,
} from './memoryData';

// Block stack utilities
export {
	isInstructionIsInsideAModule,
	isInstructionInsideFunction,
	isInstructionInsideModuleOrFunction,
	isInstructionIsInsideBlock,
} from './blockStack';

// Operand type utilities
export { areAllOperandsIntegers, areAllOperandsFloats } from './operandTypes';

// Compilation utilities
export { calculateWordAlignedSizeOfMemory, saveByteCode } from './compilation';

// Memory instruction parser
export { parseMemoryInstructionArguments } from './memoryInstructionParser';

// Memory flags
export { getMemoryFlags } from './memoryFlags';

// Re-export getPointerDepth from syntax helpers (removing duplicate)
export { getPointerDepth } from '../syntax/memoryIdentifierHelpers';
