import { beforeEach, describe, expect, it, vi } from 'vitest';

const projectRegistryEntry = {
	title: 'Audio Buffer',
	category: 'Audio',
	path: 'audio/audioBuffer.8f4e',
	url: 'https://static.llllllllllll.com/8f4e/example-projects/audio/audioBuffer.8f4e',
};

describe('projectRegistry', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
	});

	it('fetches project entries from the hosted registry', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ projects: [projectRegistryEntry] })));
		vi.stubGlobal('fetch', fetchMock);

		const { getListOfProjects, getDefaultProjectUrl } = await import('./projectRegistry');

		await expect(getListOfProjects()).resolves.toEqual([projectRegistryEntry]);
		await expect(getDefaultProjectUrl()).resolves.toBe(projectRegistryEntry.url);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching('https://static.llllllllllll.com/8f4e/example-projects/registry.json\\?_t=\\d+'),
			{ cache: 'no-store' }
		);
	});
});
