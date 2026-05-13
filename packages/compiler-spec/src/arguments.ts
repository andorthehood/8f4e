export const ArgumentType = {
	LITERAL: 'literal',
	IDENTIFIER: 'identifier',
	STRING_LITERAL: 'string_literal',
	COMPILE_TIME_EXPRESSION: 'compile_time_expression',
} as const;

// eslint-disable-next-line no-redeclare
export type ArgumentType = (typeof ArgumentType)[keyof typeof ArgumentType];

/**
 * The syntactic class of an identifier-shaped argument.
 * Computed from token shape alone by the tokenizer; no semantic resolution is needed.
 */
export type ReferenceKind =
	| 'plain'
	| 'constant'
	| 'memory-pointer'
	| 'memory-reference'
	| 'element-count'
	| 'element-word-size'
	| 'element-max'
	| 'element-min'
	| 'pointee-element-word-size'
	| 'pointee-element-max'
	| 'intermodular-reference'
	| 'intermodular-module-reference'
	| 'intermodular-module-nth-reference'
	| 'intermodular-element-count'
	| 'intermodular-element-word-size'
	| 'intermodular-element-max'
	| 'intermodular-element-min';

export type ArgumentLiteral = {
	type: typeof ArgumentType.LITERAL;
	value: number;
	isInteger: boolean;
	isFloat64?: boolean;
	isHex?: boolean;
};

type IdentifierBase<K extends ReferenceKind, S extends 'local' | 'intermodule'> = {
	type: typeof ArgumentType.IDENTIFIER;
	value: string;
	referenceKind: K;
	scope: S;
};

type PlainIdentifier = IdentifierBase<'plain', 'local'>;
type ConstantIdentifier = IdentifierBase<'constant', 'local'>;
type MemoryPointerIdentifier = IdentifierBase<'memory-pointer', 'local'> & {
	targetMemoryId: string;
};
type MemoryReferenceIdentifier = IdentifierBase<'memory-reference', 'local'> & {
	targetMemoryId: string;
	isEndAddress: boolean;
};
type ElementCountIdentifier = IdentifierBase<'element-count', 'local'> & {
	targetMemoryId: string;
};
type ElementWordSizeIdentifier = IdentifierBase<'element-word-size', 'local'> & { targetMemoryId: string };
type ElementMaxIdentifier = IdentifierBase<'element-max', 'local'> & {
	targetMemoryId: string;
};
type ElementMinIdentifier = IdentifierBase<'element-min', 'local'> & {
	targetMemoryId: string;
};
type PointeeElementWordSizeIdentifier = IdentifierBase<'pointee-element-word-size', 'local'> & {
	targetMemoryId: string;
	isPointee: true;
};
type PointeeElementMaxIdentifier = IdentifierBase<'pointee-element-max', 'local'> & {
	targetMemoryId: string;
	isPointee: true;
};
type IntermodularReferenceIdentifier = IdentifierBase<'intermodular-reference', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
	isEndAddress: boolean;
};
type IntermodularModuleReferenceIdentifier = IdentifierBase<'intermodular-module-reference', 'intermodule'> & {
	targetModuleId: string;
	isEndAddress: boolean;
};
type IntermodularModuleNthReferenceIdentifier = IdentifierBase<'intermodular-module-nth-reference', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryIndex: number;
};
type IntermodularElementCountIdentifier = IdentifierBase<'intermodular-element-count', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};
type IntermodularElementWordSizeIdentifier = IdentifierBase<'intermodular-element-word-size', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};
type IntermodularElementMaxIdentifier = IdentifierBase<'intermodular-element-max', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};
type IntermodularElementMinIdentifier = IdentifierBase<'intermodular-element-min', 'intermodule'> & {
	targetModuleId: string;
	targetMemoryId: string;
};

export type ArgumentIdentifier =
	| PlainIdentifier
	| ConstantIdentifier
	| MemoryPointerIdentifier
	| MemoryReferenceIdentifier
	| ElementCountIdentifier
	| ElementWordSizeIdentifier
	| ElementMaxIdentifier
	| ElementMinIdentifier
	| PointeeElementWordSizeIdentifier
	| PointeeElementMaxIdentifier
	| IntermodularReferenceIdentifier
	| IntermodularModuleReferenceIdentifier
	| IntermodularModuleNthReferenceIdentifier
	| IntermodularElementCountIdentifier
	| IntermodularElementWordSizeIdentifier
	| IntermodularElementMaxIdentifier
	| IntermodularElementMinIdentifier;

export type ArgumentStringLiteral = {
	type: typeof ArgumentType.STRING_LITERAL;
	value: string;
};

/**
 * A fully parsed compile-time expression operand.
 * Operands are either numeric literals or classified identifier nodes;
 * they are never nested expressions because the grammar only allows a single operator.
 */
export type CompileTimeOperand = ArgumentLiteral | ArgumentIdentifier;

export type ArgumentCompileTimeExpression = {
	type: typeof ArgumentType.COMPILE_TIME_EXPRESSION;
	left: CompileTimeOperand;
	operator: '+' | '-' | '*' | '/' | '^';
	right: CompileTimeOperand;
	/**
	 * Module IDs referenced by intermodular operands in this expression.
	 * Pre-computed by the tokenizer so that compiler consumers (module sort, namespace
	 * collection, intermodule deferral) can read this field directly instead of
	 * inspecting each operand's type and referenceKind themselves.
	 */
	intermoduleIds: ReadonlyArray<string>;
};

export type Argument = ArgumentLiteral | ArgumentIdentifier | ArgumentStringLiteral | ArgumentCompileTimeExpression;
