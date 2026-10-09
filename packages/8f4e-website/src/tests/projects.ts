import type { GalleryCategory } from '../gallery';

const fixtureRoot = '../../../compiler/tests/';
// The editor currently supports only default memory, so omit fixtures that require additional regions.
const fixtureUrls = import.meta.glob<string>(
	[
		'../../../compiler/tests/**/*.test.8f4e',
		'!../../../compiler/tests/memory-regions.test.8f4e',
		'!../../../compiler/tests/region-selection.test.8f4e',
	],
	{
		query: '?url&no-inline',
		import: 'default',
		eager: true,
	}
);

function humanize(name: string): string {
	const words = name.replaceAll('-', ' ');
	return words.charAt(0).toUpperCase() + words.slice(1);
}

const categoryTitles: Record<string, string> = {
	'': 'General',
	stdlib: 'Standard library',
	'intermodular-references': 'Intermodular references',
};

const categories = new Map<string, GalleryCategory>();
for (const [file, projectUrl] of Object.entries(fixtureUrls).sort(([left], [right]) => left.localeCompare(right))) {
	const path = file.slice(fixtureRoot.length);
	const directory = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
	let category = categories.get(directory);
	if (!category) {
		category = { path: directory || 'general', title: categoryTitles[directory] ?? humanize(directory), projects: [] };
		categories.set(directory, category);
	}
	category.projects.push({
		id: path.replace(/\.test\.8f4e$/, ''),
		title: humanize(path.slice(path.lastIndexOf('/') + 1).replace(/\.test\.8f4e$/, '')),
		description: path,
		projectUrl,
		githubUrl: `https://github.com/andorthehood/8f4e/blob/main/packages/compiler/tests/${path}`,
	});
}

export const projectCategories = [...categories.entries()]
	.sort(([left], [right]) => left.localeCompare(right))
	.map(([, category]) => category);
