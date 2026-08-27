import { describe, expect, it } from 'vitest';

import { createMainThreadRuntimeDef } from './runtimeDef';

describe('MainThread runtime config', () => {
	it('requires a positive sample rate', () => {
		const runtimeDef = createMainThreadRuntimeDef(
			() => new Uint8Array(),
			() => null
		);

		expect(runtimeDef.editorConfigSchema?.schema.properties).toMatchObject({
			sampleRate: { type: 'number', minimum: 1 },
		});
	});
});
