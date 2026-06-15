import type {
	Argument,
	ArgumentCompileTimeExpression,
	ArgumentLiteral,
	CompilerASTLine,
	CompileTimeOperand,
	Const,
	ConstLine,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';

type InlineableAST = ValidatedModuleAST | ValidatedConstantsAST | ValidatedFunctionAST | ValidatedPrototypeAST;
export type ConstantEnvironment = Readonly<Record<string, Const>>;
export type ConstantNamespaceMap = Readonly<Record<string, ConstantEnvironment>>;

export const ConstantInliningErrorCode = {
	DUPLICATE_NAMESPACE: 'DUPLICATE_NAMESPACE',
	UNRESOLVED_CONSTANT_VALUE: 'UNRESOLVED_CONSTANT_VALUE',
	UNRESOLVED_NAMESPACE: 'UNRESOLVED_NAMESPACE',
} as const;

export type ConstantInliningErrorCodeValue = (typeof ConstantInliningErrorCode)[keyof typeof ConstantInliningErrorCode];

export class ConstantInliningError extends Error {
	readonly code: ConstantInliningErrorCodeValue;
	readonly detail: string;
	readonly line?: CompilerASTLine;

	constructor(code: ConstantInliningErrorCodeValue, message: string, line?: CompilerASTLine) {
		super(`${message} (${code})`);
		this.name = 'ConstantInliningError';
		this.code = code;
		this.detail = message;
		this.line = line;
	}
}

export interface InlineConstantsOptions {
	readonly namespaces?: ConstantNamespaceMap;
}

function literalToConst(argument: ArgumentLiteral): Const {
	return {
		value: argument.value,
		isInteger: argument.isInteger,
		...(argument.isFloat64 ? { isFloat64: true } : {}),
	};
}

function constToLiteral(resolved: Const): ArgumentLiteral {
	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
	};
}

function resolveConstantOperand(operand: CompileTimeOperand, constants: ConstantEnvironment): Const | undefined {
	if (operand.type === ArgumentType.LITERAL) {
		return literalToConst(operand);
	}

	return operand.referenceKind === 'constant' ? constants[operand.value] : undefined;
}

function evaluateExpression(
	lhsConst: Const,
	rhsConst: Const,
	operator: ArgumentCompileTimeExpression['operator']
): Const | undefined {
	if (operator === '/' && rhsConst.value === 0) {
		return undefined;
	}

	const value =
		operator === '+'
			? lhsConst.value + rhsConst.value
			: operator === '-'
				? lhsConst.value - rhsConst.value
				: operator === '*'
					? lhsConst.value * rhsConst.value
					: operator === '/'
						? lhsConst.value / rhsConst.value
						: lhsConst.value ** rhsConst.value;
	const isFloat64 = !!lhsConst.isFloat64 || !!rhsConst.isFloat64;
	const isInteger = !isFloat64 && lhsConst.isInteger && rhsConst.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}

function resolveConstantArgument(argument: Argument, constants: ConstantEnvironment): Const | undefined {
	if (argument.type === ArgumentType.LITERAL) {
		return literalToConst(argument);
	}

	if (argument.type === ArgumentType.IDENTIFIER) {
		return resolveConstantOperand(argument, constants);
	}

	if (argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return undefined;
	}

	const leftConst = resolveConstantOperand(argument.left, constants);
	const rightConst = resolveConstantOperand(argument.right, constants);
	return leftConst && rightConst ? evaluateExpression(leftConst, rightConst, argument.operator) : undefined;
}

function inlineArgument(argument: Argument, constants: ConstantEnvironment): Argument {
	if (argument.type === ArgumentType.IDENTIFIER) {
		const resolved = resolveConstantOperand(argument, constants);
		return resolved ? constToLiteral(resolved) : argument;
	}

	if (argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const left = inlineOperand(argument.left, constants);
	const right = inlineOperand(argument.right, constants);
	if (left === argument.left && right === argument.right) {
		return argument;
	}

	return {
		...argument,
		left,
		right,
	};
}

function inlineOperand(operand: CompileTimeOperand, constants: ConstantEnvironment): CompileTimeOperand {
	const resolved = operand.type === ArgumentType.IDENTIFIER ? resolveConstantOperand(operand, constants) : undefined;
	return resolved ? constToLiteral(resolved) : operand;
}

function resolveConstLine(line: ConstLine, constants: Record<string, Const>): Const {
	const resolved = resolveConstantArgument(line.arguments[1], constants);
	if (!resolved) {
		throw new ConstantInliningError(
			ConstantInliningErrorCode.UNRESOLVED_CONSTANT_VALUE,
			`Unable to resolve constant ${line.arguments[0].value}`,
			line
		);
	}

	constants[line.arguments[0].value] = resolved;
	return resolved;
}

function importConstants(
	line: CompilerASTLine,
	constants: Record<string, Const>,
	namespaces: ConstantNamespaceMap
): boolean {
	if (line.instruction !== 'use') {
		return true;
	}

	const namespaceId = line.arguments[0].value;
	const namespace = namespaces[namespaceId];
	if (!namespace) {
		return false;
	}

	Object.assign(constants, namespace);
	return true;
}

function tryCollectConstants(ast: ValidatedModuleAST | ValidatedConstantsAST, namespaces: ConstantNamespaceMap) {
	const constants: Record<string, Const> = {};

	for (const line of ast.lines) {
		if (!importConstants(line, constants, namespaces)) {
			return undefined;
		}
		if (line.instruction === 'const') {
			resolveConstLine(line, constants);
		}
	}

	return constants;
}

function findUnresolvedUseLine(
	asts: readonly (ValidatedModuleAST | ValidatedConstantsAST)[],
	namespaces: ConstantNamespaceMap
): CompilerASTLine | undefined {
	for (const ast of asts) {
		for (const line of ast.lines) {
			if (line.instruction === 'use' && !namespaces[line.arguments[0].value]) {
				return line;
			}
		}
	}

	return undefined;
}

export function collectConstantNamespaces(
	asts: readonly InlineableAST[],
	options: InlineConstantsOptions = {}
): ConstantNamespaceMap {
	const namespaces: Record<string, ConstantEnvironment> = { ...(options.namespaces ?? {}) };
	const pending = asts.filter((ast): ast is ValidatedModuleAST | ValidatedConstantsAST => {
		return ast.type === 'module' || ast.type === 'constants';
	});

	while (pending.length > 0) {
		let madeProgress = false;

		for (let index = pending.length - 1; index >= 0; index--) {
			const ast = pending[index];
			if (Object.hasOwn(namespaces, ast.id)) {
				throw new ConstantInliningError(
					ConstantInliningErrorCode.DUPLICATE_NAMESPACE,
					`Duplicate constant namespace ${ast.id}`,
					ast.lines[0]
				);
			}

			const constants = tryCollectConstants(ast, namespaces);
			if (!constants) {
				continue;
			}

			namespaces[ast.id] = constants;
			pending.splice(index, 1);
			madeProgress = true;
		}

		if (!madeProgress) {
			throw new ConstantInliningError(
				ConstantInliningErrorCode.UNRESOLVED_NAMESPACE,
				'Unable to resolve constant namespace dependencies',
				findUnresolvedUseLine(pending, namespaces) ?? pending[0].lines[0]
			);
		}
	}

	return namespaces;
}

function inlineConstantsInASTWithNamespaces<TAST extends InlineableAST>(
	ast: TAST,
	namespaces: ConstantNamespaceMap
): TAST {
	const constants: Record<string, Const> = {};

	for (const line of ast.lines) {
		if (!importConstants(line, constants, namespaces)) {
			throw new ConstantInliningError(
				ConstantInliningErrorCode.UNRESOLVED_NAMESPACE,
				'Unable to resolve constant namespace',
				line
			);
		}

		if (line.instruction === 'const') {
			line.arguments[1] = constToLiteral(resolveConstLine(line, constants));
			continue;
		}

		if (line.instruction === 'use') {
			continue;
		}

		for (let index = 0; index < line.arguments.length; index++) {
			line.arguments[index] = inlineArgument(line.arguments[index], constants);
		}
	}

	return ast;
}

export function inlineConstantsInASTs<TAST extends InlineableAST>(
	asts: readonly TAST[],
	options: InlineConstantsOptions = {}
): TAST[] {
	const namespaces = collectConstantNamespaces(asts, options);
	return asts.map(ast => inlineConstantsInASTWithNamespaces(ast, namespaces));
}

export function inlineConstantsInAST<TAST extends InlineableAST>(
	ast: TAST,
	options: InlineConstantsOptions = {}
): TAST {
	const namespaces = collectConstantNamespaces([ast], options);
	return inlineConstantsInASTWithNamespaces(ast, namespaces);
}

export type { InlineableAST };
