import type { EditorConfigSchemaContribution, State } from '@8f4e/editor-state-types';
import type { WebUiOptions } from '@8f4e/web-ui';

export const WEB_UI_EDITOR_CONFIG_SCHEMA_CONTRIBUTION_ID = 'web-ui';

export const webUiEditorConfigSchemaContribution: EditorConfigSchemaContribution = {
	root: 'webUI',
	schema: {
		type: 'object',
		properties: {
			overlay: {
				type: 'object',
				properties: {
					entry: { type: 'string' },
					target: { type: 'string' },
					width: { type: 'integer', minimum: 1 },
					height: { type: 'integer', minimum: 1 },
					magnification: { type: 'number', minimum: 1 },
					filter: { type: 'string', enum: ['nearest', 'linear'] },
				},
				additionalProperties: false,
			},
		},
		additionalProperties: false,
	},
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getFiniteNumber(record: Record<string, unknown>, key: string): number | undefined {
	const value = record[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getPositiveInteger(record: Record<string, unknown>, key: string): number | undefined {
	const value = getFiniteNumber(record, key);
	return value !== undefined && Number.isInteger(value) && value > 0 ? value : undefined;
}

function isQualifiedMemoryId(value: string): boolean {
	const [moduleId, memoryId, extra] = value.split(':');
	return Boolean(moduleId) && Boolean(memoryId) && extra === undefined;
}

export function resolveWebUiOverlayConfig(state: State): WebUiOptions['overlayTexture'] | undefined {
	const webUiConfig = state.editorConfig.webUI;
	const overlay = isRecord(webUiConfig) ? webUiConfig.overlay : undefined;

	if (!isRecord(overlay)) {
		return undefined;
	}

	const target = overlay.target;
	const entry = overlay.entry;
	const width = getPositiveInteger(overlay, 'width');
	const height = getPositiveInteger(overlay, 'height');
	const magnificationValue = getFiniteNumber(overlay, 'magnification');
	const magnification = magnificationValue !== undefined && magnificationValue >= 1 ? magnificationValue : undefined;

	if (
		typeof entry !== 'string' ||
		!entry ||
		typeof target !== 'string' ||
		!isQualifiedMemoryId(target) ||
		width === undefined ||
		height === undefined
	) {
		return undefined;
	}

	const filter = overlay.filter === 'linear' || overlay.filter === 'nearest' ? overlay.filter : undefined;

	return {
		entry,
		target,
		width,
		height,
		...(magnification ? { magnification } : {}),
		...(filter ? { filter } : {}),
	};
}
