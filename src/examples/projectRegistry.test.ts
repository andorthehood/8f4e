import { beforeEach, describe, expect, it, vi } from 'vitest';

const projectMetadata = {
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

	it('fetches project metadata from the hosted registry', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ projects: [projectMetadata] })));
		vi.stubGlobal('fetch', fetchMock);

		const { getListOfProjects, getDefaultProjectUrl } = await import('./projectRegistry');

		await expect(getListOfProjects()).resolves.toEqual([projectMetadata]);
		await expect(getDefaultProjectUrl()).resolves.toBe(projectMetadata.url);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching('https://static.llllllllllll.com/8f4e/example-projects/registry.json\\?_t=\\d+'),
			{ cache: 'no-store' }
		);
	});
});
