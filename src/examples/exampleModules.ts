import type { ModuleMetadata } from '@8f4e/editor-state';

const moduleLoaders = import.meta.glob('../../packages/examples/src/modules/**/*.8f4em', {
	query: '?raw',
	import: 'default',
}) as Record<string, () => Promise<string>>;

const modulePathPrefix = '../../packages/examples/src/modules/';

const upperCaseWords = new Set(['lsb', 'msb', 'midi', 'pcm', 'cga', 'xor']);
const preserveCaseWords = new Set(['8bit', '16bit', '32bit']);

function toTitleCase(value: string): string {
	return value
		.split('-')
		.map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ');
}

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

			if (preserveCaseWords.has(lower)) {
				return lower;
			}

			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(' ');
}

function getRelativeModulePath(filePath: string): string {
	return filePath.replace(modulePathPrefix, '');
}

function getSlug(relativePath: string): string {
	const fileName = relativePath.split('/').pop();

	if (!fileName) {
		throw new Error(`Invalid module path: ${relativePath}`);
	}

	return fileName.replace(/\.8f4em$/, '');
}

function getCategory(relativePath: string): string {
	const segments = relativePath.split('/');
	const categorySegments = segments.slice(0, -1);

	return categorySegments.map(toTitleCase).join('/');
}

type ModuleEntry = {
	slug: string;
	path: string;
	loader: () => Promise<string>;
};

const moduleEntries: ModuleEntry[] = Object.entries(moduleLoaders)
	.map(([path, loader]) => {
		const relativePath = getRelativeModulePath(path);

		return {
			slug: getSlug(relativePath),
			path: relativePath,
			loader,
		};
	})
	.sort((left, right) => left.slug.localeCompare(right.slug));

/**
 * Manifest of available modules with their lazy loaders.
 * Maps slug -> loader function.
 */
export const moduleManifest: Record<string, () => Promise<string>> = Object.fromEntries(
	moduleEntries.map(({ slug, loader }) => [slug, loader])
);

/**
 * Metadata is derived from the module file paths.
 * Category comes from the directory structure and title comes from the file name.
 */
export const moduleMetadata: ModuleMetadata[] = moduleEntries.map(({ slug, path }) => ({
	slug,
	title: humanizeSlug(slug),
	category: getCategory(path),
}));

export default moduleManifest;
