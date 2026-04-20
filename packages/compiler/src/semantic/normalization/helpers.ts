import {
	getDataStructureByteAddress,
	getElementCount,
	getElementMaxValue,
	getElementMinValue,
	getElementWordSize,
	getEndByteAddress,
	getMemoryStringLastByteAddress,
	getModuleEndByteAddress,
	getPointeeElementMaxValue,
	getPointeeElementWordSize,
	isMemoryIdentifier,
} from '@8f4e/compiler-memory-layout';
import { ArgumentType, type Argument, type CompileTimeOperand } from '@8f4e/tokenizer';

import { ErrorCode, getError } from '../../compilerError';

import type {
	AST,
	ArgumentIdentifier,
	CompilationContext,
	DefaultLine,
	MapLine,
	NormalizedDefaultLine,
	NormalizedMapLine,
	PushLine,
} from '../../types';

type ResolvedConst = { value: number; isInteger: boolean; isFloat64?: boolean };

function evaluateConstantExpression(
	left: ResolvedConst,
	right: ResolvedConst,
	operator: '+' | '-' | '*' | '/' | '%' | '^'
): ResolvedConst {
	const value =
		operator === '+'
			? left.value + right.value
			: operator === '-'
				? left.value - right.value
				: operator === '*'
					? left.value * right.value
					: operator === '/'
						? left.value / right.value
						: operator === '%'
							? left.value % right.value
							: left.value ** right.value;
	const isFloat64 = left.isFloat64 || right.isFloat64;
	return {
		value,
		isInteger: !isFloat64 && left.isInteger && right.isInteger && Number.isInteger(value),
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}

function resolveCompileTimeOperand(
	operand: CompileTimeOperand,
	context: CompilationContext
): ResolvedConst | undefined {
	if (operand.type === ArgumentType.LITERAL) {
		return {
			value: operand.value,
			isInteger: operand.isInteger,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
		};
	}

	if (operand.referenceKind === 'constant' || operand.referenceKind === 'plain') {
		const resolvedConst = context.namespace.consts[operand.value];
		if (resolvedConst) {
			return resolvedConst;
		}
	}

	const { memory, modules } = context.namespace;

	if (
		operand.referenceKind === 'intermodular-element-word-size' ||
		operand.referenceKind === 'intermodular-element-count' ||
		operand.referenceKind === 'intermodular-element-max' ||
		operand.referenceKind === 'intermodular-element-min'
	) {
		const targetMemory = modules?.[operand.targetModuleId]?.memory;
		if (!targetMemory || !Object.hasOwn(targetMemory, operand.targetMemoryId)) {
			return undefined;
		}
		const memoryItem = targetMemory[operand.targetMemoryId];
		if (operand.referenceKind === 'intermodular-element-word-size') {
			return { value: getElementWordSize(targetMemory, operand.targetMemoryId), isInteger: true };
		}
		if (operand.referenceKind === 'intermodular-element-count') {
			return { value: getElementCount(targetMemory, operand.targetMemoryId), isInteger: true };
		}
		if (operand.referenceKind === 'intermodular-element-max') {
			return { value: getElementMaxValue(targetMemory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
		}
		return { value: getElementMinValue(targetMemory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'pointee-element-word-size' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getPointeeElementWordSize(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'element-word-size' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getElementWordSize(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'element-count' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getElementCount(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'pointee-element-max' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getPointeeElementMaxValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'element-max' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getElementMaxValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'element-min' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getElementMinValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'intermodular-module-reference') {
		const targetNamespace = modules?.[operand.targetModuleId];
		if (targetNamespace) {
			return {
				value: operand.isEndAddress
					? getModuleEndByteAddress(targetNamespace.byteAddress, targetNamespace.wordAlignedSize)
					: targetNamespace.byteAddress,
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-module-nth-reference') {
		const targetNamespace = modules?.[operand.targetModuleId];
		if (!targetNamespace) {
			return undefined;
		}
		const item = Object.values(targetNamespace.memory)[operand.targetMemoryIndex];
		return item ? { value: item.byteAddress, isInteger: true } : undefined;
	}

	if (operand.referenceKind === 'intermodular-reference') {
		const targetNamespace = modules?.[operand.targetModuleId];
		const targetMemory = targetNamespace?.memory?.[operand.targetMemoryId];
		if (targetMemory) {
			return {
				value: operand.isEndAddress
					? getEndByteAddress(targetMemory.byteAddress, targetMemory.wordAlignedSize)
					: targetMemory.byteAddress,
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'memory-reference') {
		if (operand.targetMemoryId === 'this') {
			if (!operand.isEndAddress) {
				return { value: context.startingByteAddress, isInteger: true };
			}
			if (typeof context.currentModuleWordAlignedSize === 'number') {
				return {
					value: getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize),
					isInteger: true,
				};
			}
			return undefined;
		}

		if (Object.hasOwn(memory, operand.targetMemoryId)) {
			return {
				value: operand.isEndAddress
					? getMemoryStringLastByteAddress(memory, operand.targetMemoryId)
					: getDataStructureByteAddress(memory, operand.targetMemoryId),
				isInteger: true,
			};
		}
	}

	return undefined;
}

function tryResolveCompileTimeArgument(context: CompilationContext, argument: Argument): ResolvedConst | undefined {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveCompileTimeOperand(argument.left, context);
		const rightConst = resolveCompileTimeOperand(argument.right, context);

		if (leftConst === undefined || rightConst === undefined || (argument.operator === '/' && rightConst.value === 0)) {
			return undefined;
		}

		return evaluateConstantExpression(leftConst, rightConst, argument.operator);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}

	return resolveCompileTimeOperand(argument, context);
}

function normalizeArgument(argument: Argument, context: CompilationContext): Argument {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveCompileTimeArgument(context, argument);
	if (!resolved) {
		return argument;
	}

	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
	};
}

export function normalizeArgumentsAtIndexes<TLine extends AST[number]>(
	line: TLine,
	context: CompilationContext,
	indexes: number[]
): TLine {
	let changed = false;
	const nextArguments = line.arguments.map((argument, index) => {
		if (!indexes.includes(index)) {
			return argument;
		}

		const normalized = normalizeArgument(argument, context);
		if (normalized !== argument) {
			changed = true;
		}
		return normalized;
	});

	return (changed ? { ...line, arguments: nextArguments } : line) as TLine;
}

export function validateOrDeferCompileTimeExpression(
	argument: Extract<Argument, { type: ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: AST[number],
	context: CompilationContext
): false {
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context as never, {
		identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
	});
}

export function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: ArgumentType.IDENTIFIER }>,
	line: AST[number],
	context: CompilationContext
): false {
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context as never, { identifier: argument.value });
}

export function normalizeDefaultLine(
	line: DefaultLine,
	context: CompilationContext
): NormalizedDefaultLine | DefaultLine {
	const normalized = normalizeArgumentsAtIndexes(line, context, [0]);
	const argument = normalized.arguments[0];

	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		validateOrDeferCompileTimeExpression(argument, line, context);
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		validateOrDeferUnresolvedIdentifier(argument, line, context);
	}

	return normalized as NormalizedDefaultLine | DefaultLine;
}

export function normalizeMapLine(line: MapLine, context: CompilationContext): NormalizedMapLine | MapLine {
	const normalized = normalizeArgumentsAtIndexes(line, context, [0, 1]);

	for (const index of [0, 1]) {
		const argument = normalized.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			validateOrDeferCompileTimeExpression(argument, line, context);
		}
		if (argument?.type === ArgumentType.IDENTIFIER) {
			validateOrDeferUnresolvedIdentifier(argument, line, context);
		}
	}

	return normalized as NormalizedMapLine | MapLine;
}

export function normalizePushLine(line: PushLine, context: CompilationContext): PushLine {
	const normalized = normalizeArgumentsAtIndexes(line, context, [0]);
	const argument = normalized.arguments[0];

	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		validateOrDeferCompileTimeExpression(argument, line, context);
	}

	if (argument?.type === ArgumentType.IDENTIFIER) {
		validatePushIdentifier(argument, line, context);
	}

	return normalized as PushLine;
}

function validatePushIdentifier(argument: ArgumentIdentifier, line: AST[number], context: CompilationContext): void {
	const { value, referenceKind } = argument;
	const { memory, modules } = context.namespace;

	if (
		referenceKind === 'plain' &&
		(isMemoryIdentifier(memory, value) || !!context.locals[value] || !!context.namespace.consts[value])
	) {
		return;
	}

	if (referenceKind === 'memory-pointer' && isMemoryIdentifier(memory, argument.targetMemoryId)) {
		return;
	}

	if (
		referenceKind === 'memory-reference' &&
		(argument.targetMemoryId === 'this' || isMemoryIdentifier(memory, argument.targetMemoryId))
	) {
		return;
	}

	if (referenceKind === 'intermodular-module-reference' && modules?.[argument.targetModuleId]) {
		return;
	}

	if (
		(referenceKind === 'intermodular-reference' ||
			referenceKind === 'intermodular-element-count' ||
			referenceKind === 'intermodular-element-word-size' ||
			referenceKind === 'intermodular-element-max' ||
			referenceKind === 'intermodular-element-min') &&
		modules?.[argument.targetModuleId]?.memory?.[argument.targetMemoryId]
	) {
		return;
	}

	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
}
