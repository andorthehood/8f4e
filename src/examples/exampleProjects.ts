import type { ProjectMetadata } from '@8f4e/editor-state';

/**
 * Base URL where example project .8f4e files are hosted.
 */
const DEFAULT_EXAMPLE_PROJECTS_BASE_URL = 'https://static.llllllllllll.com/8f4e/example-projects';
const exampleProjectsBaseUrl = DEFAULT_EXAMPLE_PROJECTS_BASE_URL.replace(/\/$/, '');
const projectPathPrefix = '../../packages/examples/src/projects/';

const projectFiles = import.meta.glob('../../packages/examples/src/projects/**/*.8f4e', {
	query: '?raw',
	import: 'default',
}) as Record<string, () => Promise<string>>;

export type ExampleProjectMetadata = ProjectMetadata & { url: string };

function toTitleCase(value: string): string {
	return value
		.split('-')
		.map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ');
}

const upperCaseWords = new Set(['lt', 'fm', 'xor']);

function humanizeSlug(slug: string): string {
	const normalized = slug
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/[-_]/g, ' ')
		.trim();

	return normalized
		.split(/\s+/)
		.map(word => {
			const lower = word.toLowerCase();

			if (upperCaseWords.has(lower)) {
				return lower.toUpperCase();
			}

			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(' ');
}

function getRelativeProjectPath(filePath: string): string {
	return filePath.replace(projectPathPrefix, '');
}

function getSlug(relativePath: string): string {
	const fileName = relativePath.split('/').pop();

	if (!fileName) {
		throw new Error(`Invalid project path: ${relativePath}`);
	}

	return fileName.replace(/\.8f4e$/, '');
}

function getCategory(relativePath: string): string {
	const segments = relativePath.split('/');
	const categorySegments = segments.slice(0, -1);

	return categorySegments.map(toTitleCase).join('/');
}

export const projectMetadata: ExampleProjectMetadata[] = Object.keys(projectFiles)
	.filter(path => !path.includes('/archived/'))
	.map(path => {
		const relativePath = getRelativeProjectPath(path);
		const slug = getSlug(relativePath);

		return {
			title: humanizeSlug(slug),
			category: getCategory(relativePath),
			url: `${exampleProjectsBaseUrl}/${relativePath}`,
		};
	})
	.sort((left, right) => left.title.localeCompare(right.title));
