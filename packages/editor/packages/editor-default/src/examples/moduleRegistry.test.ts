import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sources = vi.hoisted(() => new Map<string, () => Promise<string>>());
vi.mock('virtual:8f4e-sources/example-modules', () => ({ default: sources }));

const moduleSource = 'module adrEnv\nuse math\nuse env\nuse adrEnvelope\nmoduleEnd';
const loadEnvelope = vi.fn(async () => moduleSource);
const loadMath = vi.fn(async () => 'constants math\nconst PI 3.14159\nconstantsEnd');

const moduleRegistryEntry = {
	slug: 'adrEnvelope',
	title: 'Adr Envelope',
	category: 'Envelopes',
	path: 'envelopes/adrEnvelope.8f4em',
};

describe('moduleRegistry', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		sources.clear();
		sources.set('src/modules/envelopes/adrEnvelope', loadEnvelope);
		sources.set('src/modules/constants/math', loadMath);
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('lists sorted metadata without loading any module source or fetching a registry', async () => {
		const { getListOfModules } = await import('./moduleRegistry');

		await expect(getListOfModules()).resolves.toEqual([
			moduleRegistryEntry,
			{ slug: 'math', title: 'Math', category: 'Constants', path: 'constants/math.8f4em' },
		]);
		expect(loadEnvelope).not.toHaveBeenCalled();
		expect(loadMath).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('loads only the requested module and reuses its source', async () => {
		const { getModule } = await import('./moduleRegistry');

		await expect(getModule(moduleRegistryEntry.slug)).resolves.toBe(moduleSource);
		await expect(getModule(moduleRegistryEntry.slug)).resolves.toBe(moduleSource);
		expect(loadEnvelope).toHaveBeenCalledOnce();
		expect(loadMath).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('keeps nested categories and title capitalization from the previous catalog', async () => {
		sources.set('src/modules/functions/midi-tools/midiCodes', loadMath);
		sources.set('src/modules/oscillators/sawUnsigned8bitInt', loadEnvelope);
		const { getListOfModules } = await import('./moduleRegistry');

		expect(await getListOfModules()).toEqual(
			expect.arrayContaining([
				{
					slug: 'midiCodes',
					title: 'MIDI Codes',
					category: 'Functions/Midi Tools',
					path: 'functions/midi-tools/midiCodes.8f4em',
				},
				{
					slug: 'sawUnsigned8bitInt',
					title: 'Saw Unsigned8bit Int',
					category: 'Oscillators',
					path: 'oscillators/sawUnsigned8bitInt.8f4em',
				},
			])
		);
	});

	it('resolves known dependencies while excluding self references and project-local constants', async () => {
		const { getModuleDependencies } = await import('./moduleRegistry');

		await expect(getModuleDependencies('adrEnvelope')).resolves.toEqual(['math']);
		await expect(getModuleDependencies('adrEnvelope')).resolves.toEqual(['math']);
		expect(loadEnvelope).toHaveBeenCalledOnce();
		expect(loadMath).not.toHaveBeenCalled();
	});

	it.each(['missing', 'toString', '__proto__'])('rejects unknown module %s', async slug => {
		const { getModule } = await import('./moduleRegistry');

		await expect(getModule(slug)).rejects.toThrow(`Module not found: ${slug}`);
	});

	it('allows retrying a module whose chunk failed to load', async () => {
		loadEnvelope.mockRejectedValueOnce(new Error('Chunk unavailable'));
		const { getModule } = await import('./moduleRegistry');

		await expect(getModule('adrEnvelope')).rejects.toThrow('Chunk unavailable');
		await expect(getModule('adrEnvelope')).resolves.toBe(moduleSource);
	});

	it('rejects duplicate slugs instead of loading a module from the wrong category', async () => {
		sources.set('src/modules/other/adrEnvelope', loadMath);

		await expect(import('./moduleRegistry')).rejects.toThrow('Duplicate example module slug: adrEnvelope');
	});
});
