import type { ReferenceKind } from '@8f4e/tokenizer';

export function isIntermoduleReferenceKind(referenceKind: ReferenceKind): boolean {
	return (
		referenceKind === 'intermodular-module-reference' ||
		referenceKind === 'intermodular-reference' ||
		referenceKind === 'intermodular-element-count' ||
		referenceKind === 'intermodular-element-word-size' ||
		referenceKind === 'intermodular-element-max' ||
		referenceKind === 'intermodular-element-min'
	);
}
