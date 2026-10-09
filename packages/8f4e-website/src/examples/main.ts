import { mountGallery } from '../gallery';
import { projectCategories } from './projects';

const dispose = mountGallery({
	title: 'Examples',
	storageNamespace: 'gallery',
	categories: projectCategories.map(category => ({
		...category,
		projects: category.projects.map(project => ({
			...project,
			projectUrl: `https://static.8f4e.com/example-projects/${project.path}`,
			githubUrl: `https://github.com/andorthehood/8f4e/blob/main/packages/examples/src/projects/${project.path}`,
		})),
	})),
});

import.meta.hot?.dispose(dispose);
