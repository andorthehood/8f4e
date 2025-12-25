export { isConstantName } from './isConstantName';
export { instructionParser, isComment, isValidInstruction } from './instructionParser';
export {
	ArgumentType,
	parseArgument,
	type Argument,
	type ArgumentLiteral,
	type ArgumentIdentifier,
} from './parseArgument';
export { getBlockType, getModuleId, getFunctionId, type CodeBlockType } from './blockTypeDetection';
export { SyntaxRulesError, SyntaxErrorCode } from './syntaxError';
export {
	hasMemoryReferencePrefix,
	extractMemoryReferenceBase,
	isMemoryPointerIdentifier,
	extractMemoryPointerBase,
	hasElementCountPrefix,
	extractElementCountBase,
	hasElementWordSizePrefix,
	extractElementWordSizeBase,
	getPointerDepth,
} from './memoryIdentifierHelpers';
export {
	parseMemoryInstructionArgumentsShape,
	type MemoryArgumentShape,
	type ParsedMemoryInstructionArguments,
} from './memoryInstructionParser';
