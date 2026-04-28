import { beforeEach, describe, expect, it, vi } from 'vitest';

const moduleMetadata = {
	slug: 'adrEnvelope',
	title: 'ADR Envelope',
	category: 'Envelopes',
	path: 'envelopes/adrEnvelope.8f4em',
	url: 'https://static.llllllllllll.com/8f4e/example-modules/envelopes/adrEnvelope.8f4em',
};

describe('moduleRegistry', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
	});

	it('fetches module metadata from the hosted registry', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ modules: [moduleMetadata] })));
		vi.stubGlobal('fetch', fetchMock);

		const { getListOfModules } = await import('./moduleRegistry');

		await expect(getListOfModules()).resolves.toEqual([moduleMetadata]);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching('https://static.llllllllllll.com/8f4e/example-modules/registry.json\\?_t=\\d+'),
			{ cache: 'no-store' }
		);
	});

	it('fetches module source from the URL declared by the hosted registry', async () => {
		const moduleSource = '; @block module test';
		const fetchMock = vi.fn(async request => {
			const url = String(request);

			if (url.startsWith('https://static.llllllllllll.com/8f4e/example-modules/registry.json')) {
				return new Response(JSON.stringify({ modules: [moduleMetadata] }));
			}

			return new Response(moduleSource);
		});
		vi.stubGlobal('fetch', fetchMock);

		const { getModule } = await import('./moduleRegistry');

		await expect(getModule(moduleMetadata.slug)).resolves.toBe(moduleSource);
		expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(`${moduleMetadata.url}\\?_t=\\d+`), {
			cache: 'no-store',
		});
	});
});
