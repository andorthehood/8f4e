import { ArgumentType, type Argument, type ReferenceKind } from '@8f4e/tokenizer';

const layoutDependentReferenceKinds: ReadonlySet<ReferenceKind> = new Set([
	'memory-pointer',
	'memory-reference',
	'element-count',
	'element-word-size',
	'element-max',
	'element-min',
	'pointee-element-word-size',
	'pointee-element-max',
	'intermodular-reference',
	'intermodular-module-reference',
	'intermodular-module-nth-reference',
	'intermodular-element-count',
	'intermodular-element-word-size',
	'intermodular-element-max',
	'intermodular-element-min',
]);

export function getLayoutDependentReference(argument: Argument): string | undefined {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return getLayoutDependentReference(argument.left) ?? getLayoutDependentReference(argument.right);
	}
	if (argument.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}
	return layoutDependentReferenceKinds.has(argument.referenceKind) ? argument.value : undefined;
}
