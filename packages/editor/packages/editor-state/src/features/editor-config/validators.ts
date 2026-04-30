import { setEditorConfigPath } from './paths';

import { formatDidYouMeanSuffix } from '../global-editor-directives/suggestions';

import type { CodeError } from '@8f4e/editor-state-types';
import type {
	EditorConfig,
	EditorConfigEntry,
	EditorConfigValidator,
	EditorConfigValidatorRegistry,
} from '@8f4e/editor-state-types';

export function getEditorConfigValidators(registry: EditorConfigValidatorRegistry): EditorConfigValidator[] {
	return Object.values(registry).filter((validator): validator is EditorConfigValidator => Boolean(validator));
}

export function getEditorConfigKnownPaths(registry: EditorConfigValidatorRegistry): string[] {
	return getEditorConfigValidators(registry).flatMap(validator => validator.knownPaths);
}

function getValidator(path: string, registry: EditorConfigValidatorRegistry): EditorConfigValidator | undefined {
	return getEditorConfigValidators(registry).find(validator => validator.matches(path));
}

function getEditorConfigEntryValidationMessage(
	entry: EditorConfigEntry,
	registry: EditorConfigValidatorRegistry
): string | undefined {
	const validator = getValidator(entry.path, registry);
	return (
		validator?.validate(entry) ??
		(validator
			? undefined
			: `@config: unknown config path '${entry.path}'${formatDidYouMeanSuffix(entry.path, getEditorConfigKnownPaths(registry))}`)
	);
}

export function validateEditorConfigEntries(
	entries: EditorConfigEntry[],
	registry: EditorConfigValidatorRegistry
): CodeError[] {
	const errors: CodeError[] = [];

	for (const entry of entries) {
		const message = getEditorConfigEntryValidationMessage(entry, registry);

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

export function resolveEditorConfigEntries(
	entries: EditorConfigEntry[],
	registry: EditorConfigValidatorRegistry
): EditorConfig {
	const config: EditorConfig = {};

	for (const entry of entries) {
		if (getEditorConfigEntryValidationMessage(entry, registry)) {
			continue;
		}

		const validator = getValidator(entry.path, registry);

		setEditorConfigPath(config, entry.path, validator?.parse?.(entry) ?? entry.value);
	}

	return config;
}
