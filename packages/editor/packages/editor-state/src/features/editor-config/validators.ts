import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

import type { CodeError } from '~/types';
import type { EditorConfigEntry, EditorConfigValidator, EditorConfigValidatorRegistry } from './types';

export function getEditorConfigValidators(registry: EditorConfigValidatorRegistry): EditorConfigValidator[] {
	return Object.values(registry).filter((validator): validator is EditorConfigValidator => Boolean(validator));
}

export function getEditorConfigKnownPaths(registry: EditorConfigValidatorRegistry): string[] {
	return getEditorConfigValidators(registry).flatMap(validator => validator.knownPaths);
}

function getValidator(path: string, registry: EditorConfigValidatorRegistry): EditorConfigValidator | undefined {
	return getEditorConfigValidators(registry).find(validator => validator.matches(path));
}

export function validateEditorConfigEntries(
	entries: EditorConfigEntry[],
	registry: EditorConfigValidatorRegistry
): CodeError[] {
	const errors: CodeError[] = [];
	const knownPaths = getEditorConfigKnownPaths(registry);

	for (const entry of entries) {
		const validator = getValidator(entry.path, registry);
		const message =
			validator?.validate(entry) ??
			(validator
				? undefined
				: `@config: unknown config path '${entry.path}'${formatDidYouMeanSuffix(entry.path, knownPaths)}`);

		if (!message) {
			continue;
		}

		errors.push({
			lineNumber: entry.rawRow,
			message,
			codeBlockId: entry.codeBlockId,
		});
	}

	return errors;
}
