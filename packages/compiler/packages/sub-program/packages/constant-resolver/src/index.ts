import type {
	Argument,
	ArgumentCompileTimeExpression,
	ArgumentLiteral,
	CompilerASTLine,
	CompileTimeOperand,
	Const,
	ConstantResolutionBlockFacts,
	ConstantResolutionLineFacts,
	ConstLine,
	ProjectConstantScope,
	ProjectGroupPath,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';

type ConstantResolvableAST = ValidatedModuleAST | ValidatedConstantsAST | ValidatedFunctionAST | ValidatedPrototypeAST;
export type ConstantEnvironment = Readonly<Record<string, Const>>;
export type ConstantNamespaceMap = Readonly<Record<string, ConstantEnvironment>>;

export interface ResolveConstantsSubProgramAST<
	TPrototype extends ValidatedPrototypeAST = ValidatedPrototypeAST,
	TModule extends ValidatedModuleAST = ValidatedModuleAST,
	TConstants extends ValidatedConstantsAST = ValidatedConstantsAST,
	TFunction extends ValidatedFunctionAST = ValidatedFunctionAST,
> {
	prototypes: readonly TPrototype[];
	modules: readonly TModule[];
	constants: readonly TConstants[];
	functions: readonly TFunction[];
}

export interface ResolveConstantsInput<
	TPrototype extends ValidatedPrototypeAST = ValidatedPrototypeAST,
	TModule extends ValidatedModuleAST = ValidatedModuleAST,
	TConstants extends ValidatedConstantsAST = ValidatedConstantsAST,
	TFunction extends ValidatedFunctionAST = ValidatedFunctionAST,
> {
	ast: ResolveConstantsSubProgramAST<TPrototype, TModule, TConstants, TFunction>;
	projectConstantScopes?: readonly ProjectConstantScope[];
}

export interface ConstantResolutionReport {
	prototypes: ConstantResolutionBlockFacts[];
	modules: ConstantResolutionBlockFacts[];
	constants: ConstantResolutionBlockFacts[];
	functions: ConstantResolutionBlockFacts[];
}

export interface ResolveConstantsResult {
	namespaces: ConstantNamespaceMap;
	references: ConstantResolutionReport;
}

export const ConstantResolverErrorCode = {
	DUPLICATE_CONSTANT: 'DUPLICATE_CONSTANT',
	DUPLICATE_NAMESPACE: 'DUPLICATE_NAMESPACE',
	UNRESOLVED_PASSED_CONSTANT: 'UNRESOLVED_PASSED_CONSTANT',
	UNRESOLVED_CONSTANT_VALUE: 'UNRESOLVED_CONSTANT_VALUE',
	UNRESOLVED_NAMESPACE: 'UNRESOLVED_NAMESPACE',
} as const;

export type ConstantResolverErrorCodeValue = (typeof ConstantResolverErrorCode)[keyof typeof ConstantResolverErrorCode];

export class ConstantResolverError extends Error {
	readonly code: ConstantResolverErrorCodeValue;
	readonly detail: string;
	readonly line?: CompilerASTLine;

	constructor(code: ConstantResolverErrorCodeValue, message: string, line?: CompilerASTLine) {
		super(`${message} (${code})`);
		this.name = 'ConstantResolverError';
		this.code = code;
		this.detail = message;
		this.line = line;
	}
}

export interface ResolveConstantsOptions {
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

function resolveConstantArgumentReference(argument: Argument, constants: ConstantEnvironment): Argument {
	if (argument.type === ArgumentType.IDENTIFIER) {
		const resolved = resolveConstantOperand(argument, constants);
		return resolved ? constToLiteral(resolved) : argument;
	}

	if (argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const left = resolveConstantOperandReference(argument.left, constants);
	const right = resolveConstantOperandReference(argument.right, constants);
	if (left === argument.left && right === argument.right) {
		return argument;
	}

	return {
		...argument,
		left,
		right,
	};
}

function resolveConstantOperandReference(
	operand: CompileTimeOperand,
	constants: ConstantEnvironment
): CompileTimeOperand {
	const resolved = operand.type === ArgumentType.IDENTIFIER ? resolveConstantOperand(operand, constants) : undefined;
	return resolved ? constToLiteral(resolved) : operand;
}

function assertConstantNameAvailable(name: string, protectedNames: ReadonlySet<string>, line: CompilerASTLine): void {
	if (protectedNames.has(name)) {
		throw new ConstantResolverError(
			ConstantResolverErrorCode.DUPLICATE_CONSTANT,
			`Constant ${name} conflicts with a project-scope constant`,
			line
		);
	}
}

function resolveConstLine(
	line: ConstLine,
	constants: Record<string, Const>,
	protectedNames: ReadonlySet<string> = new Set()
): Const {
	assertConstantNameAvailable(line.arguments[0].value, protectedNames, line);
	const resolved = resolveConstantArgument(line.arguments[1], constants);
	if (!resolved) {
		throw new ConstantResolverError(
			ConstantResolverErrorCode.UNRESOLVED_CONSTANT_VALUE,
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
	namespaces: ConstantNamespaceMap,
	protectedNames: ReadonlySet<string> = new Set()
): boolean {
	if (line.instruction !== 'use') {
		return true;
	}

	const namespaceId = line.arguments[0].value;
	const namespace = namespaces[namespaceId];
	if (!namespace) {
		return false;
	}

	for (const name of Object.keys(namespace)) {
		assertConstantNameAvailable(name, protectedNames, line);
	}
	Object.assign(constants, namespace);
	return true;
}

function tryCollectConstants(
	ast: ValidatedModuleAST | ValidatedConstantsAST,
	namespaces: ConstantNamespaceMap,
	initialConstants: ConstantEnvironment
) {
	const constants: Record<string, Const> = { ...initialConstants };
	const exportedConstants: Record<string, Const> = {};
	const protectedNames = new Set(Object.keys(initialConstants));

	for (const line of ast.lines) {
		if (!importConstants(line, constants, namespaces, protectedNames)) {
			return undefined;
		}
		if (line.instruction === 'use') {
			Object.assign(exportedConstants, namespaces[line.arguments[0].value]);
		}
		if (line.instruction === 'const') {
			exportedConstants[line.arguments[0].value] = resolveConstLine(line, constants, protectedNames);
		}
	}

	return exportedConstants;
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

function flattenSubProgramAST(input: ResolveConstantsSubProgramAST): ConstantResolvableAST[] {
	return [...input.prototypes, ...input.modules, ...input.constants, ...input.functions];
}

function collectConstantNamespacesFromAsts(
	asts: readonly ConstantResolvableAST[],
	projectConstantEnvironments: ReadonlyMap<ProjectGroupPath, ConstantEnvironment>,
	options: ResolveConstantsOptions = {}
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
				throw new ConstantResolverError(
					ConstantResolverErrorCode.DUPLICATE_NAMESPACE,
					`Duplicate constant namespace ${ast.id}`,
					ast.lines[0]
				);
			}

			const constants = tryCollectConstants(
				ast,
				namespaces,
				projectConstantEnvironments.get(ast.projectGroupPath ?? '') ?? {}
			);
			if (!constants) {
				continue;
			}

			namespaces[ast.id] = constants;
			pending.splice(index, 1);
			madeProgress = true;
		}

		if (!madeProgress) {
			throw new ConstantResolverError(
				ConstantResolverErrorCode.UNRESOLVED_NAMESPACE,
				'Unable to resolve constant namespace dependencies',
				findUnresolvedUseLine(pending, namespaces) ?? pending[0].lines[0]
			);
		}
	}

	return namespaces;
}

function collectConstantNamespaces(
	input: ResolveConstantsInput,
	projectConstantEnvironments: ReadonlyMap<ProjectGroupPath, ConstantEnvironment>,
	options: ResolveConstantsOptions = {}
): ConstantNamespaceMap {
	return collectConstantNamespacesFromAsts(flattenSubProgramAST(input.ast), projectConstantEnvironments, options);
}

function buildProjectConstantEnvironments(
	scopes: readonly ProjectConstantScope[] = []
): ReadonlyMap<ProjectGroupPath, ConstantEnvironment> {
	const environments = new Map<ProjectGroupPath, ConstantEnvironment>();

	for (const scope of scopes) {
		const parentConstants = scope.parentGroupPath === undefined ? {} : environments.get(scope.parentGroupPath);
		if (!parentConstants) {
			throw new Error(`Project constant scope ${scope.groupPath} was composed before its parent`);
		}

		const constants: Record<string, Const> = {};
		for (const line of scope.lines) {
			const name = line.arguments[0].value;
			if (Object.hasOwn(constants, name)) {
				throw new ConstantResolverError(
					ConstantResolverErrorCode.DUPLICATE_CONSTANT,
					`Duplicate project-scope constant ${name}`,
					line
				);
			}

			if (line.instruction === 'pass') {
				const resolved = parentConstants[name];
				if (!resolved) {
					throw new ConstantResolverError(
						ConstantResolverErrorCode.UNRESOLVED_PASSED_CONSTANT,
						`Passed constant ${name} is undefined in the parent project scope`,
						line
					);
				}
				constants[name] = resolved;
				continue;
			}

			constants[name] = resolveConstLine(line, constants);
		}
		environments.set(scope.groupPath, constants);
	}

	return environments;
}

function haveSameArguments(left: CompilerASTLine['arguments'], right: CompilerASTLine['arguments']): boolean {
	return left.length === right.length && left.every((argument, index) => argument === right[index]);
}

function collectLineFacts(
	sourceLine: CompilerASTLine,
	resolvedArguments: CompilerASTLine['arguments'] | undefined
): ConstantResolutionLineFacts | undefined {
	if (!resolvedArguments || haveSameArguments(sourceLine.arguments, resolvedArguments)) {
		return undefined;
	}

	return { arguments: resolvedArguments };
}

function resolveConstantsInASTWithNamespaces(
	ast: ConstantResolvableAST,
	namespaces: ConstantNamespaceMap,
	initialConstants: ConstantEnvironment
): ConstantResolutionBlockFacts {
	const constants: Record<string, Const> = { ...initialConstants };
	const protectedNames = new Set(Object.keys(initialConstants));
	const lineFacts = ast.lines.map(line => {
		if (!importConstants(line, constants, namespaces, protectedNames)) {
			throw new ConstantResolverError(
				ConstantResolverErrorCode.UNRESOLVED_NAMESPACE,
				'Unable to resolve constant namespace',
				line
			);
		}

		if (line.instruction === 'const') {
			const resolvedValue = constToLiteral(resolveConstLine(line, constants, protectedNames));
			return collectLineFacts(line, [line.arguments[0], resolvedValue] as CompilerASTLine['arguments']);
		}

		if (line.instruction === 'use') {
			return undefined;
		}

		const resolvedArguments = line.arguments.map(argument => resolveConstantArgumentReference(argument, constants));
		return collectLineFacts(line, resolvedArguments);
	});

	return { lineFacts };
}

export function resolveConstants<
	TPrototype extends ValidatedPrototypeAST,
	TModule extends ValidatedModuleAST,
	TConstants extends ValidatedConstantsAST,
	TFunction extends ValidatedFunctionAST,
>(
	input: ResolveConstantsInput<TPrototype, TModule, TConstants, TFunction>,
	options: ResolveConstantsOptions = {}
): ResolveConstantsResult {
	const projectConstantEnvironments = buildProjectConstantEnvironments(input.projectConstantScopes);
	const getInitialConstants = (ast: ConstantResolvableAST) =>
		projectConstantEnvironments.get(ast.projectGroupPath ?? '') ?? {};
	const namespaces = collectConstantNamespaces(input, projectConstantEnvironments, options);
	return {
		namespaces,
		references: {
			prototypes: input.ast.prototypes.map(ast =>
				resolveConstantsInASTWithNamespaces(ast, namespaces, getInitialConstants(ast))
			),
			modules: input.ast.modules.map(ast =>
				resolveConstantsInASTWithNamespaces(ast, namespaces, getInitialConstants(ast))
			),
			constants: input.ast.constants.map(ast =>
				resolveConstantsInASTWithNamespaces(ast, namespaces, getInitialConstants(ast))
			),
			functions: input.ast.functions.map(ast =>
				resolveConstantsInASTWithNamespaces(ast, namespaces, getInitialConstants(ast))
			),
		},
	};
}

export type { ConstantResolvableAST };
