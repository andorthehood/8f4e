import { describe, expect, it } from 'vitest';

import { EXPORT_FILE_NAME_CONFIG_PATH, exportFileNameEditorConfigValidator } from './editorConfig';

describe('export file name editor config', () => {
	it('validates export file name config path', () => {
		expect(
			exportFileNameEditorConfigValidator.validate({
				path: EXPORT_FILE_NAME_CONFIG_PATH,
				value: 'samplePlayer',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBeUndefined();
	});

	it('rejects empty export file names', () => {
		expect(
			exportFileNameEditorConfigValidator.validate({
				path: EXPORT_FILE_NAME_CONFIG_PATH,
				value: '',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe('@config export.fileName: file name must be non-empty');
	});
});
