import { projects } from './projects';

export function getExampleId(url: URL, mobile: boolean): string | null {
	let id: string;
	try {
		id = decodeURIComponent(url.hash.slice(1));
	} catch {
		return mobile ? null : projects[0].id;
	}
	return projects.some(project => project.id === id) ? id : mobile ? null : projects[0].id;
}

export function withExampleId(url: URL, id: string | null): URL {
	const nextUrl = new URL(url);
	nextUrl.hash = id ?? '';
	return nextUrl;
}
