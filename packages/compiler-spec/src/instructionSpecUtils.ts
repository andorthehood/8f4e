import type {
	BlockCloseEffectSpec,
	InstructionDocumentation,
	InstructionSpec,
	MemoryLoadVariant,
	MemoryOperationEffectSpec,
	ResolvedStackEffect,
	StackConsumeSpec,
	StackEffectSpec,
	StackMutationSpec,
	StackProducedItemSpec,
	StackValueLabel,
} from './instructionSpecs';
import type { BlockTypeValue } from './semantic';

/** Options used to attach documentation and a fixed stack effect to a spec. */
interface DocsAndStackOptions {
	shortDescription: string;
	inputs: readonly StackValueLabel[];
	outputs: readonly StackValueLabel[];
	effect?: StackMutationSpec;
}

/** Options used to create a fixed stack effect spec. */
interface StackOptions {
	inputs: readonly StackValueLabel[];
	outputs: readonly StackValueLabel[];
	effect?: StackMutationSpec;
}

/** Builder options for memory load instruction specs. */
interface LoadInstructionOptions<TLoadVariant extends MemoryLoadVariant, TResultType extends 'int' | 'float'> {
	loadVariant: TLoadVariant;
	accessByteWidth: number;
	resultType: TResultType;
	shortDescription: string;
	output: StackValueLabel;
	effect: StackMutationSpec;
}

/**
 * Returns a spec augmented with user-facing documentation and a fixed stack effect.
 * This keeps the large instruction table compact while preserving both the
 * human-readable signature and the machine-readable stack mutation metadata.
 */
export function withDocsAndStack<TSpec extends Partial<InstructionSpec>>(
	spec: TSpec,
	{ shortDescription, inputs, outputs, effect }: DocsAndStackOptions
): TSpec & { docs: InstructionDocumentation; stack: StackEffectSpec } {
	return {
		...spec,
		docs: { shortDescription },
		stack: { inputs, outputs, ...(effect ? { effect } : {}) },
	};
}

/** Creates a fixed stack effect spec from stack labels and optional mutation metadata. */
export function stack({ inputs, outputs, effect }: StackOptions): StackEffectSpec {
	return { inputs, outputs, ...(effect ? { effect } : {}) };
}

/** Creates mutation metadata for an instruction's analysis-stack behavior. */
export function stackMutation(
	consumes: StackConsumeSpec,
	produces: readonly StackProducedItemSpec[] = []
): StackMutationSpec {
	return { consumes, produces };
}

/**
 * Creates the memory-effect metadata shared by load instruction specs.
 * The semantic compiler uses this data to validate address operands, infer the
 * loaded value type, and apply the correct access width for narrow integer loads.
 */
function memoryLoad<TLoadVariant extends MemoryLoadVariant, TResultType extends 'int' | 'float'>(
	loadVariant: TLoadVariant,
	accessByteWidth: number,
	resultType: TResultType
): {
	memory: Extract<MemoryOperationEffectSpec, { kind: 'load' }> & {
		loadVariant: TLoadVariant;
		resultType: TResultType;
	};
} {
	return {
		memory: {
			kind: 'load',
			accessByteWidth,
			loadVariant,
			resultType,
			addressOperandIndex: 0,
		},
	};
}

/**
 * Builds a complete instruction spec for a memory load variant.
 * All load instructions consume a pointer from the stack, emit one typed value,
 * and share the same source-argument and scope rules from the provided base spec.
 */
export function loadInstruction<
	TSpec extends Partial<InstructionSpec>,
	TLoadVariant extends MemoryLoadVariant,
	TResultType extends 'int' | 'float',
>(
	baseSpec: TSpec,
	{
		loadVariant,
		accessByteWidth,
		resultType,
		shortDescription,
		output,
		effect,
	}: LoadInstructionOptions<TLoadVariant, TResultType>
) {
	return withDocsAndStack(
		{ ...baseSpec, effects: memoryLoad(loadVariant, accessByteWidth, resultType) },
		{ shortDescription, inputs: ['ptr'], outputs: [output], effect }
	);
}

/**
 * Creates the block-close effect metadata for an instruction spec.
 * Closing instructions use this metadata during semantic analysis to check the
 * active block type and optionally restore or validate the block result value.
 */
export function blockClose(
	blockType: BlockTypeValue,
	{ restoreResult = false, validateFloatResult = false } = {}
): { blockClose: BlockCloseEffectSpec } {
	return { blockClose: { blockType, restoreResult, validateFloatResult } };
}

/**
 * Resolves the stack effect for an instruction spec, including line-dependent signatures.
 * Most instructions have a fixed signature, but some derive their display or
 * analysis shape from source arguments; those specs provide `stack.resolve`.
 */
export function resolveInstructionStackEffect<TLine>(
	spec: InstructionSpec<TLine>,
	line: TLine
): ResolvedStackEffect | undefined {
	if (!spec.stack) {
		return undefined;
	}

	return spec.stack.resolve?.(line) ?? spec.stack;
}
