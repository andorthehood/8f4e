import type { AddressMetadata, CompilationContext, DataStructure, MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { getMemoryItem, setMemoryDefault, setPointerMetadata } from '../memoryState';
import parseMemoryInstructionArguments from '../utils/memoryInstructionParser';
import consumePlannedDeclarationLayout from './plannedDeclarationLayout';

/** Function signature shared by semantic memory declaration compilers. */
export type MemoryDeclarationCompiler<TLine extends MemoryDeclarationLine = MemoryDeclarationLine> = (
	line: TLine,
	context: CompilationContext
) => CompilationContext;

interface DeclarationCompilerOptions {
	/** When true, the default value is truncated to an integer (for int/int8/int16). */
	truncate: boolean;
}

function getPointeeMemoryItem(
	safeRange: NonNullable<AddressMetadata['safeRange']>,
	context: CompilationContext
): DataStructure | undefined {
	const memoryId = safeRange.memoryId;
	if (!memoryId) {
		return undefined;
	}

	return getMemoryItem(context, memoryId, safeRange.moduleId);
}

function getPointeeElementCount(
	defaultAddress: AddressMetadata | undefined,
	context: CompilationContext
): number | undefined {
	const safeRange = defaultAddress?.safeRange;
	if (!safeRange || safeRange.source !== 'memory-start') {
		return undefined;
	}

	const memoryItem = getPointeeMemoryItem(safeRange, context);
	if (!memoryItem) {
		return undefined;
	}

	const byteOffset = Math.max(0, safeRange.byteAddress - memoryItem.byteAddress);
	const byteLength = memoryItem.numberOfElements * memoryItem.elementWordSize;
	return Math.max(0, Math.floor((byteLength - byteOffset) / memoryItem.elementWordSize));
}

/**
 * Factory that produces a compiler for a scalar/pointer memory
 * declaration instruction (int, int8, int16, float, float64 and their pointer
 * variants).
 *
 * Layout metadata comes from the memory planner; scalar declaration compilers
 * only add semantic defaults and pointer target metadata.
 *
 * @param options - Compiler options for this compilation pass.
 * @returns The computed result.
 */
export default function createDeclarationCompiler(options: DeclarationCompilerOptions): MemoryDeclarationCompiler {
	const { truncate } = options;

	return (line, context) => {
		const { id, defaultValue, defaultAddress } = parseMemoryInstructionArguments(line, context);
		const plannedLayout = consumePlannedDeclarationLayout(context);
		const pointerDepth = plannedLayout.declaration.pointerDepth;
		const pointeeElementCount = getPointeeElementCount(defaultAddress, context);
		const finalDefault = truncate ? Math.trunc(defaultValue) : defaultValue;
		setMemoryDefault(context, id, finalDefault, line.hasExplicitMemoryDefault);
		if (pointerDepth > 0) {
			setPointerMetadata(context, id, {
				pointeeMemoryIndex: defaultAddress?.memoryIndex ?? 0,
				...(defaultAddress?.memoryRegionName ? { pointeeMemoryRegionName: defaultAddress.memoryRegionName } : {}),
				...(pointeeElementCount !== undefined && pointeeElementCount !== 1 ? { pointeeElementCount } : {}),
			});
		}
		context.currentModuleNextWordOffset = plannedLayout.nextLocalWordOffset;

		return context;
	};
}
