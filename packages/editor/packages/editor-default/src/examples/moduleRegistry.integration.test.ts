import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { getListOfModules, getModule, getModuleDependencies } from './moduleRegistry';

const require = createRequire(import.meta.url);

describe('bundled example modules', () => {
	it('discovers real modules and returns their exact source text', async () => {
		const modules = await getListOfModules();
		const envelope = modules.find(module => module.slug === 'adrEnvelope');
		expect(envelope).toEqual({
			slug: 'adrEnvelope',
			title: 'Adr Envelope',
			category: 'Envelopes',
			path: 'envelopes/adrEnvelope.8f4em',
		});
		const source = await readFile(require.resolve('@8f4e/examples/modules/envelopes/adrEnvelope.8f4em'), 'utf8');
		await expect(getModule('adrEnvelope')).resolves.toBe(source);
	});

	it('includes generated modules in the source collection', async () => {
		const source = await readFile(
			require.resolve('@8f4e/examples/modules/lookup-tables/sineLookupTable.8f4em'),
			'utf8'
		);

		await expect(getModule('sineLookupTable')).resolves.toBe(source);
	});

	it('resolves dependencies through the local catalog', async () => {
		await expect(getModuleDependencies('jankoMap')).resolves.toEqual(['midiCodes']);
		await expect(getModuleDependencies('adrEnvelope')).resolves.toEqual([]);
	});
});
