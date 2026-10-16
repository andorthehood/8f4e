import sources from 'virtual:8f4e-sources/example-modules';

export interface ExampleModuleRegistryEntry {
	slug: string;
	title: string;
	category: string;
	path: string;
}

const upperCaseWords = new Set(['lsb', 'msb', 'midi', 'pcm', 'cga', 'crt', 'xor']);
const preserveCaseWords = new Set(['8bit', '16bit', '32bit']);

function humanizeSlug(slug: string): string {
	return slug
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/[-_]/g, ' ')
		.trim()
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

const moduleLoaders = new Map<string, () => Promise<string>>();
const moduleRegistry: ExampleModuleRegistryEntry[] = [];

for (const [sourceId, load] of sources) {
	const path = sourceId.slice('src/modules/'.length);
	const segments = path.split('/');
	const slug = segments.pop()!;
	if (moduleLoaders.has(slug)) {
		throw new Error(`Duplicate example module slug: ${slug}`);
	}
	moduleLoaders.set(slug, load);
	moduleRegistry.push({
		slug,
		title: humanizeSlug(slug),
		category: segments
			.map(segment =>
				segment
					.split('-')
					.map(word => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')
			)
			.join('/'),
		path: `${path}.8f4em`,
	});
}

moduleRegistry.sort((left, right) => left.slug.localeCompare(right.slug));

export async function getExampleModuleRegistry(): Promise<ExampleModuleRegistryEntry[]> {
	return moduleRegistry;
}

export function getExampleModuleLoader(slug: string): (() => Promise<string>) | undefined {
	return moduleLoaders.get(slug);
}
