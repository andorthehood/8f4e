import { describe, expect, it } from 'vitest';

import { createWebWorkerRuntimeDef } from './runtimeDef';

describe('WebWorker runtime config', () => {
	it('requires a positive sample rate', () => {
		const runtimeDef = createWebWorkerRuntimeDef(
			() => new Uint8Array(),
			() => null,
			class {} as unknown as new () => Worker
		);

		expect(runtimeDef.editorConfigSchema?.schema.properties).toMatchObject({
			sampleRate: { type: 'number', minimum: 1 },
		});
	});
});
