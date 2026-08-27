import type { EditorConfigSchemaContribution, State } from '@8f4e/editor-state-types';

export const BIN_EDITOR_CONFIG_SCHEMA_CONTRIBUTION_ID = 'bin';

const MODULE_MEMORY_ID_SCHEMA = {
	type: 'string' as const,
	format: 'module-memory-id',
};

const BINARY_ASSET_SCHEMA = {
	type: 'object' as const,
	properties: {
		url: { type: 'string' as const, pattern: '^\\S+$' },
		memory: MODULE_MEMORY_ID_SCHEMA,
		memories: {
			type: 'object' as const,
			additionalProperties: MODULE_MEMORY_ID_SCHEMA,
		},
	},
	additionalProperties: false,
};

export const binaryAssetsEditorConfigSchemaContribution: EditorConfigSchemaContribution = {
	root: 'bin',
	schema: {
		type: 'object',
		additionalProperties: BINARY_ASSET_SCHEMA,
	},
};

export interface BinaryAssetLoadRequest {
	id: string;
	url: string;
	memoryId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getStringRecord(value: unknown): Record<string, string> {
	if (!isRecord(value)) {
		return {};
	}

	const result: Record<string, string> = {};
	for (const [key, item] of Object.entries(value)) {
		if (typeof item === 'string' && item.length > 0) {
			result[key] = item;
		}
	}

	return result;
}

export function resolveBinaryAssetLoadRequests(state: State): BinaryAssetLoadRequest[] {
	const config = isRecord(state.editorConfig.bin) ? state.editorConfig.bin : {};
	const loadRequests: BinaryAssetLoadRequest[] = [];

	for (const [id, value] of Object.entries(config)) {
		if (!isRecord(value)) {
			console.error(`Binary asset config "${id}" must be an object.`);
			continue;
		}

		const url = getString(value.url);
		if (!url) {
			console.error(`Binary asset config "${id}" must define a url.`);
			continue;
		}

		const memory = getString(value.memory);
		if (memory) {
			loadRequests.push({ id, url, memoryId: memory });
		}

		for (const memoryId of Object.values(getStringRecord(value.memories))) {
			loadRequests.push({ id, url, memoryId });
		}
	}

	return loadRequests;
}
