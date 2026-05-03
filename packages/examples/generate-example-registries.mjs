import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(packageRoot, 'dist/registries');

const examplesBaseUrl = 'https://static.llllllllllll.com/8f4e';
const moduleBaseUrl = `${examplesBaseUrl}/example-modules`;
const projectBaseUrl = `${examplesBaseUrl}/example-projects`;

const moduleUpperCaseWords = new Set(['lsb', 'msb', 'midi', 'pcm', 'cga', 'crt', 'xor']);
const modulePreserveCaseWords = new Set(['8bit', '16bit', '32bit']);
const projectUpperCaseWords = new Set(['lt', 'fm', 'xor']);

function collectPaths(sourceDirectory, extension, { excludedDirectories = new Set() } = {}) {
	return readdirSync(sourceDirectory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = resolve(sourceDirectory, entry.name);

		if (entry.isDirectory()) {
			if (excludedDirectories.has(entry.name)) {
				return [];
			}

			return collectPaths(entryPath, extension, { excludedDirectories });
		}

		return entry.name.endsWith(extension) ? [entryPath] : [];
	});
}

function toRelativePosixPath(baseDirectory, filePath) {
	return relative(baseDirectory, filePath).split(sep).join('/');
}

function toTitleCase(value) {
	return value
		.split('-')
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ');
}

function humanizeSlug(slug, { upperCaseWords, preserveCaseWords = new Set() }) {
	const normalized = slug
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/[-_]/g, ' ')
		.trim();

	return normalized
		.split(/\s+/)
		.map((word) => {
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

function getSlug(relativePath, extension) {
	const fileName = relativePath.split('/').pop();

	if (!fileName) {
		throw new Error(`Invalid example path: ${relativePath}`);
	}

	if (!fileName.endsWith(extension)) {
		throw new Error(`Invalid example extension for ${relativePath}`);
	}

	return fileName.slice(0, -extension.length);
}

function getCategory(relativePath) {
	const segments = relativePath.split('/');
	const categorySegments = segments.slice(0, -1);

	return categorySegments.map(toTitleCase).join('/');
}

function createModuleRegistry() {
	const sourceDirectory = resolve(packageRoot, 'src/modules');
	const paths = collectPaths(sourceDirectory, '.8f4em')
		.map((filePath) => toRelativePosixPath(sourceDirectory, filePath))
		.sort();

	return {
		modules: paths
			.map((path) => {
				const slug = getSlug(path, '.8f4em');

				return {
					slug,
					title: humanizeSlug(slug, {
						upperCaseWords: moduleUpperCaseWords,
						preserveCaseWords: modulePreserveCaseWords,
					}),
					category: getCategory(path),
					path,
					url: `${moduleBaseUrl}/${path}`,
				};
			})
			.sort((left, right) => left.slug.localeCompare(right.slug)),
	};
}

function createProjectRegistry() {
	const sourceDirectory = resolve(packageRoot, 'src/projects');
	const paths = collectPaths(sourceDirectory, '.8f4e', { excludedDirectories: new Set(['archived']) })
		.map((filePath) => toRelativePosixPath(sourceDirectory, filePath))
		.sort();

	return {
		projects: paths
			.map((path) => {
				const slug = getSlug(path, '.8f4e');

				return {
					title: humanizeSlug(slug, { upperCaseWords: projectUpperCaseWords }),
					category: getCategory(path),
					path,
					url: `${projectBaseUrl}/${path}`,
				};
			})
			.sort((left, right) => left.title.localeCompare(right.title)),
	};
}

function writeRegistry(fileName, registry) {
	mkdirSync(outputDirectory, { recursive: true });
	writeFileSync(resolve(outputDirectory, fileName), `${JSON.stringify(registry, null, '\t')}\n`);
}

writeRegistry('example-modules.json', createModuleRegistry());
writeRegistry('example-projects.json', createProjectRegistry());
