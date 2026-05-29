import type {
	EditorConfig,
	EditorConfigEntry,
	EditorConfigObject,
	EditorConfigPrimitiveValue,
	EditorConfigSchemaContribution,
	EditorConfigValidator,
	JSONSchemaLike,
} from '@8f4e/editor-state-types';

export interface SchemaEditorConfigValidatorOptions {
	root: string;
	schema: JSONSchemaLike;
	formatPathError?: (path: string, knownPaths: string[]) => string;
	validateValue?: (entry: EditorConfigEntry, schema: JSONSchemaLike) => string | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMergeConfigRoot(
	defaults: Record<string, unknown>,
	overrides: EditorConfigObject | undefined
): Record<string, unknown> {
	const merged: Record<string, unknown> = { ...defaults };

	if (!overrides) {
		return merged;
	}

	for (const [key, value] of Object.entries(overrides)) {
		if (value === undefined) {
			continue;
		}

		const defaultValue = merged[key];
		if (isRecord(defaultValue) && isRecord(value)) {
			merged[key] = deepMergeConfigRoot(defaultValue, value);
			continue;
		}

		merged[key] = value;
	}

	return merged;
}

function getEditorConfigRoot(config: EditorConfig, root: string): EditorConfigObject | undefined {
	const value = config[root];

	return isRecord(value) ? (value as EditorConfigObject) : undefined;
}

export function resolveSchemaConfigRoot(
	contribution: EditorConfigSchemaContribution,
	editorConfig: EditorConfig
): Record<string, unknown> {
	return deepMergeConfigRoot(contribution.defaults ?? {}, getEditorConfigRoot(editorConfig, contribution.root));
}

function getSchemaOptions(schema: JSONSchemaLike): JSONSchemaLike[] {
	return [schema, ...(schema.oneOf ?? []), ...(schema.anyOf ?? [])];
}

export function collectSchemaConfigPaths(root: string, schema: JSONSchemaLike): string[] {
	const paths: string[] = [];

	function visit(currentPath: string, currentSchema: JSONSchemaLike): void {
		const options = getSchemaOptions(currentSchema);
		for (const option of options) {
			if (option.type === 'object' || option.properties) {
				for (const [key, childSchema] of Object.entries(option.properties ?? {})) {
					visit(`${currentPath}.${key}`, childSchema);
				}
				continue;
			}

			paths.push(currentPath);
		}
	}

	visit(root, schema);

	return Array.from(new Set(paths));
}

export function getSchemaForConfigPath(root: string, schema: JSONSchemaLike, path: string): JSONSchemaLike | undefined {
	if (path === root) {
		return schema;
	}

	if (!path.startsWith(`${root}.`)) {
		return undefined;
	}

	const segments = path.slice(root.length + 1).split('.');
	let currentSchemas: JSONSchemaLike[] = [schema];

	for (const segment of segments) {
		const nextSchemas: JSONSchemaLike[] = [];

		for (const currentSchema of currentSchemas.flatMap(getSchemaOptions)) {
			const childSchema = currentSchema.properties?.[segment];
			if (childSchema) {
				nextSchemas.push(childSchema);
			}
		}

		if (nextSchemas.length === 0) {
			return undefined;
		}

		currentSchemas = nextSchemas;
	}

	return currentSchemas[0];
}

function parseBoolean(value: string): boolean | undefined {
	if (value === 'true') {
		return true;
	}

	if (value === 'false') {
		return false;
	}

	return undefined;
}

export function parseSchemaConfigValue(value: string, schema: JSONSchemaLike): EditorConfigPrimitiveValue {
	const options = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])];
	if (!schema.type && options.length > 0) {
		const matchingOption = options.find(
			option => validateSchemaConfigValue({ path: '', value, rawRow: 0, codeBlockId: '' }, option) === undefined
		);
		return matchingOption ? parseSchemaConfigValue(value, matchingOption) : value;
	}

	if (schema.type === 'integer' || schema.type === 'number') {
		return Number(value);
	}

	if (schema.type === 'boolean') {
		return parseBoolean(value) ?? value;
	}

	return value;
}

export function validateSchemaConfigValue(entry: EditorConfigEntry, schema: JSONSchemaLike): string | undefined {
	const options = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])];
	if (!schema.type && options.length > 0) {
		const optionErrors = options.map(option => validateSchemaConfigValue(entry, option));
		if (optionErrors.some(error => error === undefined)) {
			return undefined;
		}

		return `@config ${entry.path}: invalid value '${entry.value}'`;
	}

	const parsedValue = parseSchemaConfigValue(entry.value, schema);

	if (schema.enum && !schema.enum.includes(parsedValue)) {
		return `@config ${entry.path}: invalid value '${entry.value}'`;
	}

	if (schema.type === 'integer') {
		if (!Number.isInteger(parsedValue)) {
			return `@config ${entry.path}: invalid integer value '${entry.value}'`;
		}
	}

	if (schema.type === 'number') {
		if (typeof parsedValue !== 'number' || !Number.isFinite(parsedValue)) {
			return `@config ${entry.path}: invalid number value '${entry.value}'`;
		}
	}

	if (schema.type === 'boolean' && typeof parsedValue !== 'boolean') {
		return `@config ${entry.path}: invalid boolean value '${entry.value}'`;
	}

	if (schema.type === 'string' && typeof parsedValue !== 'string') {
		return `@config ${entry.path}: invalid string value '${entry.value}'`;
	}

	if (schema.type === 'string' && schema.pattern && !new RegExp(schema.pattern).test(String(parsedValue))) {
		return `@config ${entry.path}: invalid string value '${entry.value}'`;
	}

	if (typeof parsedValue === 'number' && schema.minimum !== undefined && parsedValue < schema.minimum) {
		return `@config ${entry.path}: value ${entry.value} must be at least ${schema.minimum}`;
	}

	if (schema.type === 'object' && !isRecord(parsedValue)) {
		return `@config ${entry.path}: expected nested config values`;
	}

	return undefined;
}

export function createSchemaEditorConfigValidator({
	root,
	schema,
	formatPathError,
	validateValue,
}: SchemaEditorConfigValidatorOptions): EditorConfigValidator {
	return {
		get knownPaths() {
			return collectSchemaConfigPaths(root, schema);
		},
		matches: path => path === root || path.startsWith(`${root}.`),
		validate: entry => {
			const knownPaths = collectSchemaConfigPaths(root, schema);
			const entrySchema = getSchemaForConfigPath(root, schema, entry.path);

			if (!entrySchema) {
				return formatPathError?.(entry.path, knownPaths) ?? `@config: unknown config path '${entry.path}'`;
			}

			const customError = validateValue?.(entry, entrySchema);
			if (customError) {
				return customError;
			}

			return validateSchemaConfigValue(entry, entrySchema);
		},
		parse: entry => {
			const entrySchema = getSchemaForConfigPath(root, schema, entry.path);
			return entrySchema ? parseSchemaConfigValue(entry.value, entrySchema) : entry.value;
		},
	};
}
