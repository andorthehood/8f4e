import { loadProject, getAllProjectMetadata } from '../registry';

// Create a wrapper that provides synchronous metadata access for menus
// while lazy loading the actual project content when needed
function createLazyProjectWrappers() {
	const metadata = getAllProjectMetadata();
	const projectWrappers: Record<string, unknown> = {};

	for (const [key, meta] of Object.entries(metadata)) {
		// Create a project wrapper that loads the full project when needed
		projectWrappers[key] = {
			title: meta.title,
			author: meta.author,
			description: meta.description,
			// Add a loading method for when the full project is needed
			async load() {
				return await loadProject(key);
			},
		};
	}

	return projectWrappers;
}

// Export the lazy project wrappers
const projects = createLazyProjectWrappers();

export default projects;
