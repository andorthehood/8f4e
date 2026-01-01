export { isConstantName } from './isConstantName';
export { instructionParser } from './instructionParser';
export { isComment } from './isComment';
export { isValidInstruction } from './isValidInstruction';
export {
	ArgumentType,
	parseArgument,
	type Argument,
	type ArgumentLiteral,
	type ArgumentIdentifier,
} from './parseArgument';
export { getBlockType, type CodeBlockType } from './getBlockType';
export { getModuleId } from './getModuleId';
export { getFunctionId } from './getFunctionId';
export { SyntaxRulesError, SyntaxErrorCode } from './syntaxError';
export { hasMemoryReferencePrefix } from './hasMemoryReferencePrefix';
export { hasMemoryReferencePrefixStart } from './hasMemoryReferencePrefixStart';
export { hasMemoryReferencePrefixEnd } from './hasMemoryReferencePrefixEnd';
export { extractMemoryReferenceBase } from './extractMemoryReferenceBase';
export { isMemoryPointerIdentifier } from './isMemoryPointerIdentifier';
export { extractMemoryPointerBase } from './extractMemoryPointerBase';
export { hasElementCountPrefix } from './hasElementCountPrefix';
export { extractElementCountBase } from './extractElementCountBase';
export { hasElementWordSizePrefix } from './hasElementWordSizePrefix';
export { extractElementWordSizeBase } from './extractElementWordSizeBase';
export { isIntermodularReference } from './isIntermodularReference';
export { getPointerDepth } from './getPointerDepth';
export {
	parseMemoryInstructionArgumentsShape,
	type MemoryArgumentShape,
	type ParsedMemoryInstructionArguments,
} from './memoryInstructionParser';
